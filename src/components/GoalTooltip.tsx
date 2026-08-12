// src/components/GoalTooltip.tsx
import React from 'react';
import type { Goal } from '../types';
import '../styles/GoalTooltip.css';

interface ComparisonData {
  name: string;
  value: number;
  status: 'leading' | 'tied' | 'behind' | 'N/A';
  color: string;
}

interface GoalTooltipProps {
  data: {
    goal: Goal;
    comparison: ComparisonData[];
  };
}

const statusIndicator = {
  leading: '🥇',
  tied: '🤝',
  behind: '🏃',
  'N/A': '',
};

const renderWithIcons = (text: string) => {
  const regex = /\b(Income|Population|Reputation|Money|Lakes?|Residential|Commercial|Civic|Industrial|Investment Markers?|Investment|Airports?)\b/gi;
  const parts = text.split(regex);
  
  const map: Record<string, string> = {
    'income': 'income',
    'population': 'population',
    'reputation': 'reputation',
    'money': 'money',
    'lake': 'lake',
    'lakes': 'lake',
    'residential': 'residential',
    'commercial': 'commercial',
    'civic': 'civic',
    'industrial': 'industrial',
    'investment': 'investment',
    'investment marker': 'investment',
    'investment markers': 'investment',
    'airport': 'airport',
    'airports': 'airport'
  };
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    if (map[lower]) {
      return (
        <span key={i} className="inline-icon-replacement" title={part}>
          <img src={`/assets/tags/${map[lower]}.png`} alt={part} className="text-inline-icon" />
          <span className="sr-only">{part}</span>
        </span>
      );
    }
    return part; 
  });
};

const GoalTooltip: React.FC<GoalTooltipProps> = ({ data }) => {
  if (!data || !data.goal) return null;

  const { goal, comparison } = data;

  return (
    <div className="goal-tooltip-container">
      <div className="goal-tooltip-content">
        <div className="goal-tooltip-header">
          <span className="goal-name-text">{goal.name}</span>
        </div>
        
        <div className="goal-tooltip-body">
          <div className="goal-description-row">
            <p className="goal-tooltip-description">{renderWithIcons(goal.description)}</p>
            
            <div className="goal-bonus-amount">
              <img src="/assets/tags/population.png" alt="Population" />
              <span>+{goal.populationBonus || 0}</span>
            </div>
          </div>

          <ul className="goal-comparison-list">
            {comparison.map((player, index) => (
              <li key={index} className={`player-status-${player.status}`}>
                <img 
                  src={`/assets/colors/${player.color}.png`} 
                  className="goal-row-gem" 
                  alt="gem" 
                />
                <span className="player-name">{player.name}</span>
                <span className="player-value">{player.value}</span>
                <span className="player-status-icon">{statusIndicator[player.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GoalTooltip;