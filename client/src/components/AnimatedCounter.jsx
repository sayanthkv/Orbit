import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../lib/formatters';

export const AnimatedCounter = ({ value, duration = 0.6, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = Number(value) || 0;
    if (start === end) return;

    // If prefers-reduced-motion, set instantly
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(end);
      return;
    }

    const startTime = performance.now();
    const durationMs = duration * 1000;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [value, duration]);

  return <span className={`tabular-nums font-mono ${className}`}>{formatCurrency(displayValue)}</span>;
};

export default AnimatedCounter;
