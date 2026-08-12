// src/hooks/useGameStateSync.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { api, getErrorMessage } from "../services/api";

export function useGameStateSync() {
  const [gameState, setGameState] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether a player-initiated action is currently in flight. A ref
  // is used (rather than relying on the `isActionPending` state alone) as
  // the actual lock, since state updates aren't guaranteed to be visible
  // synchronously to a second call that fires immediately after the first
  // (e.g. a fast double-click before React re-renders with disabled inputs).
  const isActionPendingRef = useRef(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Fetch the game state from the server 
  // (Used ONLY for initial load, refresh, or manual sync)
  const fetchGameState = useCallback(async () => {
    try {
      setIsSyncing(true);
      const data = await api.getGameState();
      setGameState(data);
      setError(null);
    } catch (err) {
      console.error("Failed to sync game state:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGameState();
    // Removed setInterval to prevent HTTP polling from racing against WebSocket updates
  }, [fetchGameState]);

  // Helper: Call an API action
  // No need to fetchGameState() here because the FastAPI backend 
  // will broadcast the updated state over the WebSocket to everyone instantly
  const performAction = useCallback(
    async (actionFn: () => Promise<any>) => {
      // Ignore this call entirely if a previous action is still in flight —
      // prevents a fast double-click/tap from firing two requests before the
      // UI has a chance to disable itself, which matters here because some
      // actions (e.g. buying a market tile) address their target by array
      // index: if the first request resolves and the market shifts before
      // the second request is sent, a naive duplicate could silently act on
      // the wrong tile instead of just being a harmless no-op.
      if (isActionPendingRef.current) {
        console.warn("Action ignored: another action is still in flight.");
        return;
      }

      isActionPendingRef.current = true;
      setIsActionPending(true);
      try {
        await actionFn(); 
      } catch (err) {
        console.error("Action failed:", err);
        setError(getErrorMessage(err));
      } finally {
        isActionPendingRef.current = false;
        setIsActionPending(false);
      }
    },
    []
  );

  return { gameState, setGameState, isSyncing, error, isActionPending, fetchGameState, performAction };
}
