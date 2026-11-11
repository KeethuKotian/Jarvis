import React from 'react';
import { AssistantState } from '../types';

interface ArcReactorProps {
  state: AssistantState;
  onClick?: () => void;
}

export const ArcReactorCore: React.FC<ArcReactorProps> = ({ state, onClick }) => {
  // State specific colors
  const getStateColors = () => {
    switch (state) {
      case 'LISTENING':
        return {
          primary: '#00f3ff',
          secondary: '#38bdf8',
          glow: 'rgba(0, 243, 255, 0.65)',
          speed: '2s',
          label: 'VOICE RECEIVING'
        };
      case 'THINKING':
        return {
          primary: '#a855f7',
          secondary: '#c084fc',
          glow: 'rgba(168, 85, 247, 0.65)',
          speed: '1.2s',
          label: 'NEURAL PROCESSING'
        };
      case 'EXECUTING':
        return {
          primary: '#f59e0b',
          secondary: '#fbbf24',
          glow: 'rgba(245, 158, 11, 0.65)',
          speed: '1.5s',
          label: 'TOOL EXECUTING'
        };
      case 'SPEAKING':
        return {
          primary: '#2dd4bf',
          secondary: '#14b8a6',
          glow: 'rgba(45, 212, 191, 0.65)',
          speed: '2.5s',
          label: 'SYNTHESIZING SPEECH'
        };
      case 'ERROR':
        return {
          primary: '#ef4444',
          secondary: '#f87171',
          glow: 'rgba(239, 68, 68, 0.7)',
          speed: '0.8s',
          label: 'SUBSYSTEM ALERT'
        };
      case 'IDLE':
      default:
        return {
          primary: '#00f3ff',
          secondary: '#0284c7',
          glow: 'rgba(0, 243, 255, 0.35)',
          speed: '12s',
          label: 'CORE READY'
        };
    }
  };

  const colors = getStateColors();

  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '240px',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Outermost Telemetry Ring with Ticks */}
        <svg 
          width="240" 
          height="240" 
          viewBox="0 0 240 240"
          style={{
            position: 'absolute',
            animation: `spinClockwise ${colors.speed} linear infinite`,
            transformOrigin: 'center'
          }}
        >
          <circle 
            cx="120" 
            cy="120" 
            r="114" 
            fill="none" 
            stroke={colors.primary} 
            strokeWidth="1.5" 
            strokeDasharray="4 8"
            opacity="0.4"
          />
          <circle 
            cx="120" 
            cy="120" 
            r="108" 
            fill="none" 
            stroke={colors.primary} 
            strokeWidth="2" 
            strokeDasharray="60 30 10 30"
            opacity="0.75"
          />
        </svg>

        {/* Counter-Rotating Middle Ring */}
        <svg 
          width="200" 
          height="200" 
          viewBox="0 0 200 200"
          style={{
            position: 'absolute',
            animation: `spinCounterClockwise ${parseFloat(colors.speed) * 1.5}s linear infinite`,
            transformOrigin: 'center'
          }}
        >
          <circle 
            cx="100" 
            cy="100" 
            r="94" 
            fill="none" 
            stroke={colors.secondary} 
            strokeWidth="2" 
            strokeDasharray="15 15"
            opacity="0.6"
          />
          {/* Arc Reactor Segment Ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="100"
              y1="10"
              x2="100"
              y2="18"
              stroke={colors.primary}
              strokeWidth="2.5"
              transform={`rotate(${deg} 100 100)`}
              opacity="0.8"
            />
          ))}
        </svg>

        {/* Inner Reactor Ring */}
        <div 
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            border: `2px dashed ${colors.primary}`,
            animation: `spinClockwise ${parseFloat(colors.speed) * 2}s linear infinite`,
            boxShadow: `0 0 20px ${colors.glow}, inset 0 0 15px ${colors.glow}`,
            opacity: 0.85
          }}
        />

        {/* Central Glowing Arc Core */}
        <div 
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: `radial-gradient(circle, #ffffff 10%, ${colors.primary} 50%, ${colors.secondary} 90%)`,
            boxShadow: `0 0 35px ${colors.glow}, 0 0 70px ${colors.glow}`,
            animation: 'corePulse 2.4s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.8)'
          }}
        >
          {/* Center Micro Triangle / Node */}
          <div 
            style={{
              width: '28px',
              height: '28px',
              border: `2px solid #ffffff`,
              borderRadius: '4px',
              transform: 'rotate(45deg)',
              background: 'rgba(255, 255, 255, 0.4)'
            }}
          />
        </div>
      </div>

      {/* Real-Time Status Telemetry Display */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <div 
          className="font-display" 
          style={{ 
            fontSize: '12px', 
            letterSpacing: '2px', 
            color: colors.primary,
            textShadow: `0 0 10px ${colors.glow}`
          }}
        >
          {colors.label}
        </div>
        <div 
          className="font-mono" 
          style={{ 
            fontSize: '11px', 
            color: 'var(--text-muted)', 
            marginTop: '2px' 
          }}
        >
          ARC REACTOR MK-VII • FREQ 2.4 GHz
        </div>
      </div>
    </div>
  );
};
