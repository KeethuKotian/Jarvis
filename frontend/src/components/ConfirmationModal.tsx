import React from 'react';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  action: string;
  originalMessage: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  action,
  originalMessage,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(4, 8, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
    >
      <div
        className="hud-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          border: '1px solid var(--amber-warn)',
          boxShadow: '0 0 35px var(--amber-glow)',
          background: 'rgba(12, 22, 48, 0.95)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--amber-warn)'
            }}
          >
            <ShieldAlert size={24} color="var(--amber-warn)" />
          </div>
          <div>
            <h3 className="font-display glow-amber" style={{ fontSize: '16px', margin: 0, color: 'var(--amber-warn)' }}>
              SECURITY AUTHORIZATION REQUIRED
            </h3>
            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              CONSEQUENTIAL SYSTEM ACTION: [{action.toUpperCase()}]
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--text-main)', fontSize: '14px', marginBottom: '14px', lineHeight: 1.6 }}>
          Sir, you requested to execute: <strong style={{ color: 'var(--cyan-primary)' }}>&ldquo;{originalMessage}&rdquo;</strong>.
          This will trigger a physical workstation lock event.
        </p>

        <div 
          className="font-mono" 
          style={{ 
            background: 'rgba(0, 0, 0, 0.4)', 
            padding: '10px 14px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            color: 'var(--text-muted)',
            marginBottom: '22px',
            borderLeft: '2px solid var(--amber-warn)'
          }}
        >
          Safety Rule: LLM operations cannot perform consequential system operations without explicit interactive human authorization.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-hud btn-hud-secondary" onClick={onCancel}>
            <X size={15} />
            <span>ABORT</span>
          </button>
          <button className="btn-hud" onClick={onConfirm} style={{ background: 'var(--amber-warn)', color: '#000', borderColor: 'var(--amber-warn)' }}>
            <Check size={15} />
            <span>AUTHORIZE ACTION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
