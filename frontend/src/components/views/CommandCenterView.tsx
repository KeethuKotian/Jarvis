import React, { useRef, useEffect } from 'react';
import { 
  AssistantState, 
  ChatMessage 
} from '../../types';
import { ArcReactorCore } from '../ArcReactorCore';
import { AudioWaveform } from '../AudioWaveform';
import { 
  FileText, 
  Terminal, 
  Calendar, 
  Lock, 
  Search, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

interface CommandCenterProps {
  state: AssistantState;
  messages: ChatMessage[];
  isListening: boolean;
  onQuickAction: (command: string) => void;
  onOpenDiagnostics: () => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({
  state,
  messages,
  isListening,
  onQuickAction,
  onOpenDiagnostics
}) => {
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickDirectives = [
    { label: 'OPEN CHROME', cmd: 'open chrome', icon: FileText },
    { label: 'OPEN VS CODE', cmd: 'open vs code', icon: Terminal },
    { label: 'OPEN NOTEPAD', cmd: 'open notepad', icon: FileText },
    { label: 'SEARCH FILES', cmd: 'search files for project', icon: Search },
    { label: 'CHECK REMINDERS', cmd: 'check my reminders', icon: Calendar },
    { label: 'SYSTEM STATS', cmd: 'get system battery and memory status', icon: Terminal },
    { label: 'LOCK WORKSTATION', cmd: 'lock workstation', icon: Lock }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Center: Arc Reactor Core & Dynamic Audio Waveform */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 20px 8px',
          borderBottom: '1px solid rgba(0, 243, 255, 0.12)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 243, 255, 0.08) 0%, transparent 70%)'
        }}
      >
        <ArcReactorCore state={state} onClick={onOpenDiagnostics} />
        <div style={{ marginTop: '8px' }}>
          <AudioWaveform state={state} isActive={isListening || state === 'SPEAKING' || state === 'THINKING'} />
        </div>

        {/* Quick Action Directive Pills */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px'
          }}
        >
          {quickDirectives.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.label}
                onClick={() => onQuickAction(d.cmd)}
                className="btn-hud btn-hud-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-cyan)'
                }}
              >
                <Icon size={12} color="var(--cyan-dim)" />
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Feed Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              textAlign: 'center',
              gap: '10px'
            }}
          >
            <div className="font-display" style={{ fontSize: '16px', color: 'var(--cyan-primary)', letterSpacing: '2px' }}>
              ALL SYSTEMS ONLINE &amp; OPERATIONAL
            </div>
            <p className="font-mono" style={{ fontSize: '13px', maxWidth: '480px', color: 'var(--text-dim)' }}>
              &ldquo;Good day, sir. JARVIS is at your service. Speak naturally or type commands to launch apps, manage reminders, inspect documents, or inquire about any topic.&rdquo;
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}
            >
              {/* Message Header */}
              <div 
                className="font-mono" 
                style={{ 
                  fontSize: '10px', 
                  color: 'var(--text-dim)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
              >
                <span>{msg.role === 'user' ? 'OPERATOR' : 'J.A.R.V.I.S.'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.intent && (
                  <span className="badge-hud badge-cyan" style={{ fontSize: '9px', padding: '1px 6px' }}>
                    {msg.intent} {msg.confidence ? `(${(msg.confidence * 100).toFixed(0)}%)` : ''}
                  </span>
                )}
                {msg.tool_used && (
                  <span className="badge-hud badge-purple" style={{ fontSize: '9px', padding: '1px 6px' }}>
                    TOOL: {msg.tool_used}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className="hud-panel"
                style={{
                  maxWidth: '75%',
                  padding: '12px 18px',
                  background: msg.role === 'user' ? 'rgba(0, 243, 255, 0.12)' : 'rgba(8, 16, 36, 0.88)',
                  borderColor: msg.role === 'user' ? 'var(--cyan-dim)' : 'var(--border-cyan)',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  borderRadius: '8px'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
};
