// src/hooks/useGameUI.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { GameState, Player } from '../types';
import type { BreakdownData } from '../components/StatBreakdown';

export function useGameUI(playerName: string, gameState: GameState | null, setActionError: (msg: string) => void) {
  const [viewingPlayerName, setViewingPlayerName] = useState(playerName);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [goalComparison, setGoalComparison] = useState<any | null>(null);
  const [endGameLiveStats, setEndGameLiveStats] = useState<Record<string, Player> | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [centerCameraCounter, setCenterCameraCounter] = useState(0);
  const [highlightedStat, setHighlightedStat] = useState<string | null>(null);
  const [bgIndex, setBgIndex] = useState(1);
  const [showUndoRejected, setShowUndoRejected] = useState(false);

  // Keep viewing player synced if identity changes
  useEffect(() => setViewingPlayerName(playerName), [playerName]);

  const handleBackgroundChange = useCallback(() => setBgIndex((prev) => (prev === 9 ? 1 : prev + 1)), []);
  const handleOpenGameLog = useCallback(() => setIsLogOpen(true), []);

  const handleStatClick = useCallback((playerId: string, stat: "income" | "reputation" | "population") => {
    if (gameState?.players[playerId] && gameState.playerBoards[playerId]) {
      setBreakdown({ player: gameState.players[playerId], stat, board: gameState.playerBoards[playerId] });
    }
  }, [gameState]);

  // FIX: Use an AbortController ref so that rapid mouse-enter/leave events only
  // fire one request at a time. Any in-flight request is cancelled before the next one starts.
  const hoverAbortRef = useRef<AbortController | null>(null);

  const handleGoalHover = useCallback(async (goalId: string | null) => {
    // Cancel any previous in-flight request
    hoverAbortRef.current?.abort();

    if (!goalId) {
      setGoalComparison(null);
      return;
    }

    const controller = new AbortController();
    hoverAbortRef.current = controller;

    try {
      const data = await api.getGoalComparison(goalId, controller.signal);
      // Only update state if this request wasn't aborted before it completed
      if (!controller.signal.aborted) {
        setGoalComparison(data);
      }
    } catch (err: any) {
      // Silently ignore aborts — they are intentional cancellations, not errors
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
      setActionError(getErrorMessage(err));
      setGoalComparison(null);
    }
  }, [setActionError]);

  return {
    viewingPlayerName, setViewingPlayerName,
    isLogOpen, setIsLogOpen, handleOpenGameLog,
    breakdown, setBreakdown, handleStatClick,
    goalComparison, setGoalComparison, handleGoalHover,
    endGameLiveStats, setEndGameLiveStats,
    zoom, setZoom,
    centerCameraCounter, setCenterCameraCounter,
    highlightedStat, setHighlightedStat,
    bgIndex, handleBackgroundChange,
    showUndoRejected, setShowUndoRejected
  };
}
