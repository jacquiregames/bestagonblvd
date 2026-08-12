// src/components/AnimatedStat.tsx
import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface AnimatedStatProps {
  value: number;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value }) => {
  const animatedValue = useCountUp(value, 1500); // 1500ms animation duration
  return <>{animatedValue}</>;
};

export default AnimatedStat;