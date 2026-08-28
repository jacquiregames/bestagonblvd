// src/components/StatBreakdown.tsx
import React from 'react';
import type { Player, PlacedTile } from '../types'; 
import { useGameData } from '../context/GameDataContext';
import '../styles/StatBreakdown.css';

export interface BreakdownData {
  player: Player;
  stat: 'income' | 'reputation' | 'population';
  board: PlacedTile[];
}

interface StatBreakdownProps {
  breakdown: BreakdownData;
  onClose: () => void;
}

const STAT_COLORS = {
  income: '#FFD700',     // Gold
  reputation: '#00BFFF',  // Deep Sky Blue
  population: '#FF8C00',  // Dark Orange
};

const StatBreakdown: React.FC<StatBreakdownProps> = ({ breakdown }) => {
  const { tiles } = useGameData();
  const getTileById = (id: string) => tiles[id];
  
  const { player, stat, board } = breakdown;
  const statKey = `${stat}Change` as const;
  const title = stat.charAt(0).toUpperCase() + stat.slice(1);

  const contributors = board
    .map(pt => {
      if (pt.isLake) return null;
      const tileData = getTileById(pt.tileId);
      if (!tileData) return null;
      
      const baseValue = tileData[statKey];
      if (baseValue === 0) return null;
      
      return {
        name: tileData.name,
        value: baseValue,
        hasInvestment: pt.hasInvestment,
        category: tileData.category,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.value - a!.value);

  const positive = contributors.filter(c => c!.value > 0);
  const negative = contributors.filter(c => c!.value < 0);

  return (
    <div className="stat-breakdown-container">
      <div className="stat-breakdown-content">
        <h3 
          className="stat-breakdown-header"
          style={{ backgroundColor: STAT_COLORS[stat] }}
        >
          {title} Breakdown for {player.name}
        </h3>

        <div className="breakdown-section">
          <h4>📈 Positive Contributors</h4>
          {positive.length > 0 ? (
            <ul>
              {positive.map((item, index) => (
                <li key={index}>
                  <div className="breakdown-item-name">
                    <img 
                      src={`/assets/tags/${item!.category.toLowerCase()}.webp`} 
                      alt={item!.category}
                      className="breakdown-tile-icon"
                    />
                    {item!.name}
                    {item!.hasInvestment && ' (x2)'}
                  </div>
                  <span>{item!.value > 0 ? `+${item!.value}` : item!.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>None</p>
          )}
        </div>

        <div className="breakdown-section">
          <h4>📉 Negative Contributors</h4>
          {negative.length > 0 ? (
            <ul>
              {negative.map((item, index) => (
                <li key={index}>
                  <div className="breakdown-item-name">
                    <img 
                      src={`/assets/tags/${item!.category.toLowerCase()}.webp`} 
                      alt={item!.category}
                      className="breakdown-tile-icon"
                    />
                    {item!.name}
                    {item!.hasInvestment && ' (x2)'}
                  </div>
                  <span>{item!.value > 0 ? `+${item!.value}` : item!.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>None</p>
          )}
        </div>
        <p className="note">Note: This is a summary of base tile values and does not include conditional bonuses from adjacency, etc.</p>
      </div>
    </div>
  );
};

export default StatBreakdown; 