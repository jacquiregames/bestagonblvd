// src/components/GoalsDisplay.tsx
import React from 'react';
import { useGameData } from '../context/GameDataContext';

interface GoalsDisplayProps {
  goalIds: string[];
  onGoalHover: (goalId: string | null) => void;
}

const GoalsDisplay: React.FC<GoalsDisplayProps> = ({ goalIds, onGoalHover }) => { 
  const { goals } = useGameData();
  const getGoalById = (id: string) => goals[id];

  if (!goalIds || goalIds.length === 0) return null;

  return (
    <div className="goals-container">
      <div className="goals-list">
        {goalIds.map((goalId) => {
          const goal = getGoalById(goalId);
          if (!goal) return null;

          return (
            <div
              key={goal.id}
              className="goal-item" 
              onMouseEnter={() => onGoalHover(goalId)}
              onMouseLeave={() => onGoalHover(null)}
            >
              <img src={goal.image} alt={goal.name} /> 
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsDisplay;