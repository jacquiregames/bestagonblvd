// src/components/TurnSkyWriter.tsx
import React, { useState, useEffect } from 'react';
import '../styles/TurnSkyWriter.css';

interface VehicleConfig {
  type: string;
  image: string;
  direction: 'ltr' | 'rtl';
}

const VEHICLE_SEQUENCE: VehicleConfig[] = [
  { type: 'plane',  image: '/assets/yourturn/your_turn_plane.webp',  direction: 'rtl' },
  { type: 'jet',    image: '/assets/yourturn/your_turn_jet.webp',    direction: 'ltr' },
  { type: 'blimp',  image: '/assets/yourturn/your_turn_blimp.webp',  direction: 'rtl' },
  { type: 'rocket', image: '/assets/yourturn/your_turn_rocket.webp', direction: 'ltr' },
];

const TurnSkyWriter: React.FC<{ isMyTurn: boolean }> = ({ isMyTurn }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isMyTurn) {
      setIndex(0); // Reset sequence when turn ends
      return;
    }

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % VEHICLE_SEQUENCE.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [isMyTurn]);

  if (!isMyTurn) return null;

  const current = VEHICLE_SEQUENCE[index];

  return (
    <div className="sky-writer-container">
      <img
        key={index} // Key change forces animation restart
        src={current.image}
        className={`sky-vehicle ${current.type} ${current.direction}`}
        alt="Your Turn Notification"
      />
    </div>
  );
};

export default TurnSkyWriter;