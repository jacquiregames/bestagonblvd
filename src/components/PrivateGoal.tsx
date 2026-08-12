// src/components/PrivateGoal.tsx
import React from 'react';
import { useGameData } from '../context/GameDataContext';

interface PrivateGoalProps {
  goalId: string | undefined;
  onGoalHover: (goalId: string | null) => void;
}

const PrivateGoal: React.FC<PrivateGoalProps> = ({ goalId, onGoalHover }) => {
  const { goals } = useGameData();
  const getGoalById = (id: string) => goals[id];

  if (!goalId) return null;
  
  const goal = getGoalById(goalId);
  if (!goal) return <div>Unknown Private Goal</div>;
  
  return (
    <div className="private-goal-container"> 
      <img 
        src={goal.image} 
        alt={goal.name} 
        className="goal-item" 
        onMouseEnter={() => onGoalHover(goalId)}
        onMouseLeave={() => onGoalHover(null)}
      />
    </div>
  );
};

export default PrivateGoal;