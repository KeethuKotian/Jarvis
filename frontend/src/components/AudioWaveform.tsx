import React, { useEffect, useState } from 'react';
import { AssistantState } from '../types';

interface WaveformProps {
  state: AssistantState;
  isActive: boolean;
}

export const AudioWaveform: React.FC<WaveformProps> = ({ state, isActive }) => {
  const [barHeights, setBarHeights] = useState<number[]>(new Array(24).fill(6));

  useEffect(() => {
    if (!isActive && state === 'IDLE') {
      setBarHeights(new Array(24).fill(6));
      return;
    }

    const interval = setInterval(() => {
      setBarHeights(prev =>
        prev.map(() => {
          if (state === 'LISTENING') {
            return Math.floor(Math.random() * 32) + 8;
          } else if (state === 'SPEAKING') {
            return Math.floor(Math.random() * 26) + 10;
          } else if (state === 'THINKING') {
            return Math.floor(Math.random() * 16) + 6;
          }
          return 6;
        })
      );
    }, 75);

    return () => clearInterval(interval);
  }, [state, isActive]);

  const getColor = () => {
    switch (state) {
      case 'LISTENING': return 'var(--cyan-primary)';
      case 'SPEAKING': return '#2dd4bf';
      case 'THINKING': return 'var(--purple-ai)';
      case 'ERROR': return 'var(--red-alert)';
      default: return 'var(--cyan-dim)';
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '40px',
        padding: '0 12px'
      }}
    >
      {barHeights.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${h}px`,
            background: getColor(),
            borderRadius: '2px',
            boxShadow: `0 0 6px ${getColor()}`,
            transition: 'height 0.08s ease'
          }}
        />
      ))}
    </div>
  );
};
