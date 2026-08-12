// src/context/GameDataContext.tsx
import React, { createContext, useContext } from 'react';
import type { HexTile, Goal } from '../types';

export interface GameData {
  tiles: Record<string, HexTile>;
  goals: Record<string, Goal>;
}

const GameDataContext = createContext<GameData | null>(null);

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (!context) {
    throw new Error("useGameData must be used within a GameDataProvider");
  }
  return context;
};

export const GameDataProvider: React.FC<{ data: GameData, children: React.ReactNode }> = ({ data, children }) => (
  <GameDataContext.Provider value={data}>
    {children}
  </GameDataContext.Provider>
);