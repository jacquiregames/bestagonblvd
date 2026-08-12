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

  // FIX: Removed the duplicate boot-up useEffect that called api.getGameState() here.
  // useGameStateSync already fetches state on mount. Having both run in parallel caused
  // two simultaneous HTTP calls to /game_state on every page load, with the results
  // racing each other to set state. The WebSocket will broadcast any active game state
  // on connection, so session restoration from sessionStorage is handled below via the
  // game_started WS message in App.tsx's handleWebSocketMessage instead.
  //
  // The one thing the old boot-up did that nothing else does is restore playerName/color
  // from sessionStorage when rejoining a game in progress. We keep that part here as a
  // lightweight check that doesn't make any extra HTTP calls:
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
      // FIX: Removed the manual api.getGameState() call that was here.
      // The backend broadcasts a "game_started" WebSocket event to all connected clients
      // (including the host) immediately after starting. App.tsx's handleWebSocketMessage
      // handles that event and calls setGameState, so fetching manually is redundant and
      // causes a second HTTP round-trip + duplicate state update racing the WS message.
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

