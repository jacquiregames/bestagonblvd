// src/hooks/useGameActions.ts
import { useState, useCallback, useEffect } from 'react';
import { api, getErrorMessage } from '../services/api';
import type { PlacedTile } from '../types';
import type { CellCoord } from '../utils';

export type SelectedTile = {
  id: string;
  from: "market" | "basic";
  marketIndex?: number;
};

export type ActionMode = "place" | "lake" | "invest";

interface UseGameActionsProps {
  playerName: string;
  viewingPlayerName: string;
  isMyTurn: boolean;
  currentTurnPlayerId: string | null;
  myBoard: PlacedTile[];
  validPlacements: CellCoord[];
  performAction: (fn: () => Promise<any>) => Promise<void>;
  setErrorMessage: (msg: string) => void;
  setActionError: (msg: string) => void;
  isActionPending?: boolean;
}

export function useGameActions({
  playerName,
  viewingPlayerName,
  isMyTurn,
  currentTurnPlayerId,
  myBoard,
  validPlacements,
  performAction,
  setErrorMessage,
  setActionError,
  isActionPending = false,
}: UseGameActionsProps) {
  const [selectedTile, setSelectedTile] = useState<SelectedTile | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("place");
  const [createLakeMode, setCreateLakeMode] = useState(false);
  const [selectedMarketForLake, setSelectedMarketForLake] = useState<number | null>(null);
  const [recentlyPlaced, setRecentlyPlaced] = useState<{ q: number; r: number } | null>(null);

  // Automatically reset the UI if your turn ends
  useEffect(() => {
    if (currentTurnPlayerId !== playerName) {
      setSelectedTile(null);
      setActionMode("place");
      setCreateLakeMode(false);
      setSelectedMarketForLake(null);
    }
  }, [currentTurnPlayerId, playerName]);

  // Clear errors when swapping modes
  useEffect(() => {
    setErrorMessage("");
    setActionError("");
  }, [actionMode, selectedTile, setErrorMessage, setActionError]);

  const handleHexClick = useCallback(
    async (q: number, r: number) => {
      if (!isMyTurn || viewingPlayerName !== playerName) return;
      if (isActionPending) return;

      if (actionMode === 'place' || actionMode === 'lake') {
        const isValidPlacement = validPlacements.some(p => p.q === q && p.r === r);
        if (!isValidPlacement) {
          setErrorMessage("Invalid placement: Must place adjacent to your existing tiles.");
          return;
        }
      } else if (actionMode === 'invest') {
        const tileExists = myBoard.some((tile: PlacedTile) => tile.q === q && tile.r === r);
        if (!tileExists) {
          setErrorMessage("Invalid investment: You must click an existing tile on your board.");
          return;
        }
      }

      setErrorMessage("");
      setActionError("");

      let actionLeadsToDiscard = false;

      try {
        switch (actionMode) {
          case "place":
            if (!selectedTile) throw new Error("No tile selected");
            if (selectedTile.from === "market") {
              await performAction(() => api.placeTile(playerName, selectedTile.id, q, r, selectedTile.marketIndex!));
            } else {
              await performAction(() => api.placeBasicTile(playerName, selectedTile.id, q, r));
              actionLeadsToDiscard = true;
            }
            break;

          case "lake":
            if (selectedMarketForLake === null) {
              throw new Error("Select a market tile to discard before placing a lake.");
            }
            await performAction(() => api.createLake(playerName, selectedMarketForLake, q, r));
            setActionMode("place");
            setCreateLakeMode(false);
            setSelectedMarketForLake(null);
            break;

          case "invest":
            await performAction(() => api.placeInvestmentMarker(playerName, q, r));
            actionLeadsToDiscard = true;
            break;
        }

        if (!actionLeadsToDiscard) {
          setRecentlyPlaced({ q, r });
          // NOTE: 700ms matches the .entering animation duration
          // (hex-impact / hex-shadow-ripple, 0.7s) in GameBoard.css.
          // Keep these in sync if either value changes.
          setTimeout(() => setRecentlyPlaced(null), 700);
          setSelectedTile(null);
          setActionMode("place");
          setCreateLakeMode(false);
          setSelectedMarketForLake(null);
        }

      } catch (err) {
        const msg = getErrorMessage(err);
        setErrorMessage(msg);
        setActionError(msg);
      }
    },
    [
      isMyTurn, actionMode, performAction, selectedTile, playerName,
      viewingPlayerName, selectedMarketForLake, myBoard, validPlacements,
      setErrorMessage, setActionError, isActionPending
    ]
  );

  return {
    selectedTile, setSelectedTile,
    actionMode, setActionMode,
    createLakeMode, setCreateLakeMode,
    selectedMarketForLake, setSelectedMarketForLake,
    recentlyPlaced, setRecentlyPlaced,
    handleHexClick
  };
}
