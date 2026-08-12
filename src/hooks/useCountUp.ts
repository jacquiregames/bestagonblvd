// src/hooks/useCountUp.ts
import { useState, useEffect, useRef } from 'react';

const easeOutExpo = (t: number) => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export const useCountUp = (endValue: number, duration: number = 1000) => {
    const [count, setCount] = useState(endValue);
    const currentDisplayValueRef = useRef(endValue);

    useEffect(() => {
        // Guard against zero/negative durations instantly jumping to the end
        if (duration <= 0) {
            setCount(endValue);
            currentDisplayValueRef.current = endValue;
            return;
        }

        const startValue = currentDisplayValueRef.current;
        const frameRate = 1000 / 60; // 60 frames per second
        
        // Ensure we always have at least 1 frame to prevent division by zero
        const totalFrames = Math.max(1, Math.round(duration / frameRate));
        let currentFrame = 0;

        const counter = setInterval(() => {
            currentFrame++;
            const progress = easeOutExpo(currentFrame / totalFrames);
            const currentValue = Math.round(startValue + (endValue - startValue) * progress);

            setCount(currentValue);
            currentDisplayValueRef.current = currentValue;

            if (currentFrame >= totalFrames) {
                clearInterval(counter);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [endValue, duration]);

    return count;
};