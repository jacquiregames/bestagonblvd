// src/hooks/useCountUp.ts
import { useState, useEffect, useRef } from 'react';

export function useCountUp(endValue: number, duration: number = 500) {
  const [count, setCount] = useState(endValue);
  const prevEndValueRef = useRef(endValue);

  useEffect(() => {
    // If the target hasn't actually changed, do nothing.
    if (prevEndValueRef.current === endValue) return;

    let startTimestamp: number | null = null;
    let rafId: number;
    
    // The animation starts from wherever the current count state happens to be
    const startValue = count; 
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Use an easing function for a smoother count (optional, but looks great!)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * (endValue - startValue) + startValue);
      
      setCount(currentCount);
      
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        // Ensure it lands exactly on the target value at the end
        setCount(endValue); 
        prevEndValueRef.current = endValue;
      }
    };

    rafId = window.requestAnimationFrame(step);
    
    return () => window.cancelAnimationFrame(rafId);
    
    // We only want this effect to fire when the target 'endValue' or 'duration' changes.
    // 'count' is intentionally omitted so it doesn't re-trigger itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endValue, duration]);

  return count;
}