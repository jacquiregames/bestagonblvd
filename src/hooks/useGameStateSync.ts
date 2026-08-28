// src/hooks/useGameStateSync.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { api, getErrorMessage } from "../services/api";

export function useGameStateSync() {
  const [gameState, setGameState] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  const isActionPendingRef = useRef(false);
  const [isActionPending, setIsActionPending] = useState(false);
 
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
  }, [fetchGameState]);
 
  const performAction = useCallback(
    async (actionFn: () => Promise<any>) => { 
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
