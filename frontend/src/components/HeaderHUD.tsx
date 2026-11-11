import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  Volume2, 
  VolumeX, 
  Terminal, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderHUDProps {
  health: HealthStatus | null;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenDiagnostics: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  health,
  voiceEnabled,
  onToggleVoice,
  onOpenDiagnostics
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const cpuPercent = health?.telemetry?.cpu_percent ?? 12;
  const ramPercent = health?.telemetry?.ram_percent ?? 42;
  const isOnline = health?.status === 'ONLINE';

  return (
    <header
      className="hud-panel"
      style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderBottom: '1px solid var(--border-cyan)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100
      }}
    >
      {/* Brand & Subsystem Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isOnline ? 'var(--cyan-primary)' : 'var(--amber-warn)',
              boxShadow: isOnline ? '0 0 10px var(--cyan-primary)' : '0 0 8px var(--amber-warn)',
              animation: 'corePulse 2s infinite'
            }}
          />
          <h1 
            className="font-display glow-cyan" 
            style={{ 
              fontSize: '18px', 
              margin: 0, 
              color: 'var(--cyan-primary)',
              letterSpacing: '3px'
            }}
          >
            J.A.R.V.I.S.
          </h1>
        </div>

        <span className={`badge-hud ${isOnline ? 'badge-cyan' : 'badge-amber'}`}>
          <ShieldCheck size={12} />
          {health?.status || 'INITIALIZING'}
        </span>

        <span className="badge-hud badge-purple" style={{ display: 'none', '@media (min-width: 768px)': { display: 'inline-flex' } } as any}>
          MODEL: {health?.gemini_model || 'gemini-3.8-flash'}
        </span>
      </div>

      {/* Center Telemetry: CPU & RAM */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* CPU Monitor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={14} color="var(--cyan-dim)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }} className="font-mono">
              <span>CPU</span>
              <span style={{ color: 'var(--cyan-primary)' }}>{cpuPercent}%</span>
            </div>
            <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${cpuPercent}%`, height: '100%', background: 'var(--cyan-primary)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* RAM Monitor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} color="var(--purple-ai)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }} className="font-mono">
              <span>RAM</span>
              <span style={{ color: 'var(--purple-ai)' }}>{ramPercent}%</span>
            </div>
            <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${ramPercent}%`, height: '100%', background: 'var(--purple-ai)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Real-Time Digital Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
          <Clock size={14} color="var(--text-muted)" />
          <div className="font-mono" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-main)', letterSpacing: '1px' }}>{timeStr}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{dateStr}</div>
          </div>
        </div>
      </div>

      {/* Right Controls: Voice Toggle & Developer Diagnostics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className={`btn-hud ${voiceEnabled ? '' : 'btn-hud-secondary'}`}
          onClick={onToggleVoice}
          title={voiceEnabled ? 'Disable Spoken Responses' : 'Enable Spoken Responses'}
          style={{ padding: '7px 12px', fontSize: '12px' }}
        >
          {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span style={{ display: 'inline' }}>{voiceEnabled ? 'VOICE ON' : 'MUTED'}</span>
        </button>

        <button
          className="btn-hud btn-hud-secondary"
          onClick={onOpenDiagnostics}
          title="Open Developer Mode & ML Diagnostics"
          style={{ padding: '7px 12px', fontSize: '12px' }}
        >
          <Terminal size={15} color="var(--cyan-primary)" />
          <span>DEV MODE</span>
        </button>
      </div>
    </header>
  );
};
