// src/hooks/useGameDataFetcher.ts
import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { getGameAssets } from '../utils/assets';
import type { GameData } from '../context/GameDataContext';

export function useGameDataFetcher() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);

  useEffect(() => {
    api.getGameData().then(setGameData).catch(console.error);
  }, []);

  const assetList = useMemo(() => {
    if (!gameData) return [];
    return getGameAssets(gameData.tiles, gameData.goals);
  }, [gameData]);

  return { gameData, assetList, isAssetsLoaded, setIsAssetsLoaded };
}