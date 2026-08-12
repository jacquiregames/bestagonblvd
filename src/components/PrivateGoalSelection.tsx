// src/components/PrivateGoalSelection.tsx
import React, { useState } from 'react';
import { useGameData } from '../context/GameDataContext';
import HexButton from './HexButton';

interface PrivateGoalSelectionProps {
  goalOptions: string[];
  onConfirm: (goalId: string) => void;
  isSubmitting: boolean;
}

const PrivateGoalSelection: React.FC<PrivateGoalSelectionProps> = ({ goalOptions, onConfirm, isSubmitting }) => {
  const { goals } = useGameData();
  const getGoalById = (id: string) => goals[id];

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedGoalId) {
      onConfirm(selectedGoalId);
    }
  };

  return (
    <div className="overlay-prompt goal-selection-overlay">
      <h2>Choose Your Private Goal</h2>
      <div className="goals-container">
        <div className="goals-list-selection">
          {goalOptions.map(goalId => {
            const goal = getGoalById(goalId);
            if (!goal) return null;

            const isSelected = selectedGoalId === goal.id;
            return (
              <div
                key={goal.id}
                className={`goal-item ${isSelected ? 'goal-item-selected' : ''}`}
                title={goal.description}
                onClick={() => setSelectedGoalId(goal.id)}
              >
                <img src={goal.image} alt={goal.name} />
              </div>
            );
          })}
        </div>
      </div>
      <HexButton onClick={handleConfirm} disabled={!selectedGoalId || isSubmitting}>
        {isSubmitting ? 'Confirming...' : 'Confirm Selection'}
      </HexButton>
    </div>
  );
};

export default PrivateGoalSelection;