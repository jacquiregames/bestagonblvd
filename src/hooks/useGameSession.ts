// src/hooks/useGameSession.ts
import { useState, useCallback, useEffect } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { LobbyPlayer, GameState } from '../types';

export function useGameSession(
  gameState: GameState | null,
  setGameState: (s: GameState | null) => void,
  setErrorMessage: (msg: string) => void
) {
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem("playerName") || "");
  const [selectedColor, setSelectedColor] = useState(() => sessionStorage.getItem("playerColor") || "");
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [joining, setJoining] = useState(false);

  // Sync internal lobby state with upstream WebSocket updates
  useEffect(() => {
    if (gameState) {
      if (gameState.gameStarted && !gameStarted) {
        setGameStarted(true);
        setLobbyPlayers([]);
      } else if (!gameState.gameStarted && !gameStarted) {
        setLobbyPlayers(gameState.lobbyPlayers || []);
      }
    }
  }, [gameState, gameStarted]);

  useEffect(() => {
    const storedName = sessionStorage.getItem("playerName");
    const storedColor = sessionStorage.getItem("playerColor");
    if (storedName) setPlayerName(storedName);
    if (storedColor) setSelectedColor(storedColor);
  }, []);

  const handleJoinGame = useCallback(async () => {
    if (!playerName.trim() || !selectedColor) {
      setErrorMessage("Please enter a name and select a color.");
      return;
    }
    setJoining(true);
    try {
      const res = await api.joinGame(playerName, selectedColor);
      setLobbyPlayers(res.players || []);
      sessionStorage.setItem("playerName", playerName);
      sessionStorage.setItem("playerColor", selectedColor);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }, [playerName, selectedColor, setErrorMessage]);

  const handleAddBot = useCallback(async () => {
    try {
      const res = await api.addBot();
      setLobbyPlayers(res.players || []);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }, [setErrorMessage]);

  const handleRemoveBot = useCallback(async (name: string) => {
    try {
      const res = await api.removeBot(name);
      setLobbyPlayers(res.players || []);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }, [setErrorMessage]);

  const handleStartGame = useCallback(async () => {
    try {
      await api.startGame(); 
      setGameStarted(true);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }, [setErrorMessage]);

  const handleResetGame = useCallback(async () => {
    try {
      await api.resetGame();
      sessionStorage.clear();
      setPlayerName("");
      setSelectedColor("");
      setGameStarted(false);
      setGameState(null);
      setLobbyPlayers([]);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }, [setGameState, setErrorMessage]);

  return {
    playerName, setPlayerName,
    selectedColor, setSelectedColor,
    lobbyPlayers, setLobbyPlayers,
    gameStarted, setGameStarted,
    joining,
    handleJoinGame, handleStartGame, handleResetGame,
    handleAddBot, handleRemoveBot,
  };
}

