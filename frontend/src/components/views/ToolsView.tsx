import React, { useState } from 'react';
import { 
  FileText, 
  Calculator, 
  Image as ImageIcon, 
  Folder, 
  Terminal, 
  Globe, 
  Activity, 
  Edit3, 
  Lock, 
  Volume2, 
  VolumeX, 
  Cpu, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';

interface ToolsViewProps {
  onRequestLockConfirmation: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ onRequestLockConfirmation }) => {
  const [feedback, setFeedback] = useState<{ msg: string; success: boolean } | null>(null);
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);

  const applications = [
    { id: 'chrome', name: 'Google Chrome', desc: 'Web Browser & Engine', icon: Globe },
    { id: 'vscode', name: 'Visual Studio Code', desc: 'Code Editor & IDE', icon: Terminal },
    { id: 'notepad', name: 'Notepad', desc: 'Windows Text Editor', icon: FileText },
    { id: 'calculator', name: 'Calculator', desc: 'Standard / Scientific Math', icon: Calculator },
    { id: 'paint', name: 'Paint', desc: 'Graphic Canvas & Sketchpad', icon: ImageIcon },
    { id: 'explorer', name: 'File Explorer', desc: 'Windows File Manager', icon: Folder },
    { id: 'cmd', name: 'Command Prompt', desc: 'Windows Terminal Shell', icon: Terminal },
    { id: 'edge', name: 'Microsoft Edge', desc: 'Modern Web Browser', icon: Globe },
    { id: 'taskmgr', name: 'Task Manager', desc: 'Process & Resource Monitor', icon: Activity },
    { id: 'wordpad', name: 'Wordpad', desc: 'Rich Text Document Editor', icon: Edit3 }
  ];

  const handleLaunchApp = async (appId: string) => {
    setLaunchingApp(appId);
    soundEffects.playToolExecution();
    try {
      const res = await api.launchApp(appId);
      setFeedback({ msg: res.message || `Launched ${res.app_name}`, success: true });
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Launch rejected', success: false });
    } finally {
      setLaunchingApp(null);
    }
  };

  const handleSystemAction = async (action: string) => {
    soundEffects.playToolExecution();
    if (action === 'lock') {
      onRequestLockConfirmation();
      return;
    }

    try {
      const res = await api.systemControl(action);
      setFeedback({ msg: res.message, success: true });
    } catch (err: any) {
      setFeedback({ msg: err.message, success: false });
    }
  };

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="font-display glow-cyan" style={{ fontSize: '20px', color: 'var(--cyan-primary)', margin: 0 }}>
          APPROVED COMPUTER AUTOMATION TOOLS
        </h2>
        <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Hardware &amp; application interfaces secured by strict allowlist verification protocols.
        </p>
      </div>

      {feedback && (
        <div 
          className="hud-panel" 
          style={{ 
            padding: '12px 18px', 
            marginBottom: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            borderColor: feedback.success ? 'var(--green-online)' : 'var(--red-alert)',
            color: feedback.success ? 'var(--green-online)' : 'var(--red-alert)'
          }}
        >
          {feedback.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-mono" style={{ fontSize: '13px' }}>{feedback.msg}</span>
        </div>
      )}

      {/* Application Launchers Grid */}
      <h3 className="font-display" style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '14px' }}>
        APPROVED APPLICATION REGISTRY
      </h3>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '16px',
          marginBottom: '32px' 
        }}
      >
        {applications.map((app) => {
          const Icon = app.icon;
          const isCurrent = launchingApp === app.id;

          return (
            <div
              key={app.id}
              className="hud-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                background: 'rgba(8, 16, 36, 0.7)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(0, 243, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-cyan)'
                  }}
                >
                  <Icon size={20} color="var(--cyan-primary)" />
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                    {app.name}
                  </div>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {app.desc}
                  </div>
                </div>
              </div>

              <button
                className="btn-hud"
                disabled={isCurrent}
                onClick={() => handleLaunchApp(app.id)}
                style={{ width: '100%', fontSize: '11px', padding: '8px' }}
              >
                {isCurrent ? 'LAUNCHING...' : 'LAUNCH APPLICATION'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Safe Low-Risk System Operations */}
      <h3 className="font-display" style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '14px' }}>
        DIRECT HARDWARE &amp; SYSTEM OPERATIONS
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {/* Lock Workstation */}
        <div className="hud-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock size={20} color="var(--amber-warn)" />
            <div>
              <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)' }}>LOCK WORKSTATION</div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--amber-warn)' }}>REQUIRES CONFIRMATION</div>
            </div>
          </div>
          <button 
            className="btn-hud btn-hud-secondary"
            onClick={() => handleSystemAction('lock')}
            style={{ fontSize: '11px', padding: '8px' }}
          >
            REQUEST WORKSTATION LOCK
          </button>
        </div>

        {/* Audio Mute Toggle */}
        <div className="hud-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <VolumeX size={20} color="var(--cyan-primary)" />
            <div>
              <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)' }}>TOGGLE AUDIO MUTE</div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>WINDOWS MEDIA AUDIO KEY</div>
            </div>
          </div>
          <button 
            className="btn-hud btn-hud-secondary"
            onClick={() => handleSystemAction('mute')}
            style={{ fontSize: '11px', padding: '8px' }}
          >
            TOGGLE AUDIO MUTE
          </button>
        </div>

        {/* System Stats Telemetry */}
        <div className="hud-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu size={20} color="var(--purple-ai)" />
            <div>
              <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)' }}>SYSTEM TELEMETRY</div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>POLL HARDWARE RESOURCES</div>
            </div>
          </div>
          <button 
            className="btn-hud btn-hud-secondary"
            onClick={() => handleSystemAction('get_stats')}
            style={{ fontSize: '11px', padding: '8px' }}
          >
            QUERY HARDWARE STATUS
          </button>
        </div>
      </div>
    </div>
  );
};
