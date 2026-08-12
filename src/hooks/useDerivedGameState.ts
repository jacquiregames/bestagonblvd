// src/hooks/useDerivedGameState.ts
import { useMemo } from 'react';
import type { GameState, PlacedTile } from '../types';
import { getNeighbors, type CellCoord } from '../utils';

export function useDerivedGameState(gameState: GameState | null, playerName: string) {
  const isMyTurn = gameState?.currentTurnPlayerId === playerName;
  const playerAwaitingDiscard = gameState?.playerAwaitingDiscard;
  const isMyTurnToDiscard = playerAwaitingDiscard === playerName;
  const myPlayer = gameState?.players?.[playerName];

  const myBoard = gameState?.playerBoards?.[playerName] || [];

  const validPlacements = useMemo((): CellCoord[] => {
    if (!myBoard?.length) return [];
    const occupied = new Set(myBoard.map((t: PlacedTile) => `${t.q},${t.r}`));
    const placements = new Map<string, CellCoord>();
    for (const tile of myBoard) {
      getNeighbors(tile.q, tile.r).forEach((n) => {
        const key = `${n.q},${n.r}`;
        if (!occupied.has(key)) placements.set(key, n);
      });
    }
    return Array.from(placements.values());
  }, [myBoard]);

  const showGoalSelection = !!(gameState?.isGoalSelectionPhase && myPlayer?.privateGoalOptions && myPlayer.privateGoalOptions.length > 0);
  const showWaitingForPlayers = !!(gameState?.isGoalSelectionPhase && (!myPlayer?.privateGoalOptions || myPlayer.privateGoalOptions.length === 0));

  const currentTurnIndex = gameState ? gameState.turnOrder.indexOf(gameState.currentTurnPlayerId || "") : -1;
  const myIndex = gameState ? gameState.turnOrder.indexOf(playerName) : -1;
  
  const isPreviousPlayer = gameState && myIndex !== -1 && currentTurnIndex !== -1
    ? myIndex === (currentTurnIndex - 1 + gameState.turnOrder.length) % gameState.turnOrder.length
    : false;
    
  const canUndo = isPreviousPlayer && !gameState?.hasActedThisTurn && (gameState?.turnNumber ?? 0) > 1 && !isMyTurn;

  return {
    isMyTurn,
    isMyTurnToDiscard,
    myPlayer,
    myBoard,
    validPlacements,
    showGoalSelection,
    showWaitingForPlayers,
    canUndo
  };
}