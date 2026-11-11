import React from 'react';
import { 
  Compass, 
  MessageSquare, 
  Layers, 
  Search, 
  Calendar, 
  Brain, 
  BarChart2, 
  Server, 
  Settings 
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: 'command_center' as NavigationTab, label: 'COMMAND CORE', icon: Compass },
    { id: 'chat_history' as NavigationTab, label: 'CONVERSATIONS', icon: MessageSquare },
    { id: 'tools' as NavigationTab, label: 'APP LAUNCHER', icon: Layers },
    { id: 'file_search' as NavigationTab, label: 'FILES & DOCS', icon: Search },
    { id: 'reminders' as NavigationTab, label: 'REMINDERS', icon: Calendar },
    { id: 'memory' as NavigationTab, label: 'MEMORY VAULT', icon: Brain },
    { id: 'ml_diagnostics' as NavigationTab, label: 'ML TRANSPARENCY', icon: BarChart2 },
    { id: 'system_status' as NavigationTab, label: 'SYSTEM HEALTH', icon: Server },
    { id: 'settings' as NavigationTab, label: 'SETTINGS', icon: Settings },
  ];

  return (
    <aside
      className="hud-panel"
      style={{
        width: '230px',
        minWidth: '230px',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: '1px solid var(--border-cyan)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 0',
        height: 'calc(100vh - 57px)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 10px' }}>
        <div 
          className="font-mono" 
          style={{ 
            fontSize: '11px', 
            color: 'var(--text-dim)', 
            padding: '8px 12px 4px', 
            letterSpacing: '1px' 
          }}
        >
          NAVIGATION MODULES
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--cyan-primary)' : '1px solid transparent',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(0, 243, 255, 0.16) 0%, rgba(0, 243, 255, 0.03) 100%)' 
                  : 'transparent',
                color: isActive ? 'var(--cyan-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isActive ? '0 0 15px rgba(0, 243, 255, 0.15)' : 'none'
              }}
            >
              <Icon 
                size={18} 
                color={isActive ? 'var(--cyan-primary)' : 'var(--text-dim)'} 
                style={{ filter: isActive ? 'drop-shadow(0 0 6px var(--cyan-primary))' : 'none' }}
              />
              <span 
                className="font-display" 
                style={{ 
                  fontSize: '12px', 
                  letterSpacing: '1.2px', 
                  fontWeight: isActive ? 700 : 500 
                }}
              >
                {item.label}
              </span>

              {isActive && (
                <div 
                  style={{
                    position: 'absolute',
                    right: '8px',
                    width: '4px',
                    height: '14px',
                    background: 'var(--cyan-primary)',
                    borderRadius: '2px',
                    boxShadow: '0 0 8px var(--cyan-primary)'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Protocol Info */}
      <div 
        style={{ 
          padding: '14px 18px', 
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-dim)'
        }}
        className="font-mono"
      >
        <div>PROTOCOL: HYBRID-AI</div>
        <div>ENGINE: SCIKIT + GEMINI</div>
        <div style={{ color: 'var(--cyan-dim)', marginTop: '4px' }}>READY FOR DIRECTIVE</div>
      </div>
    </aside>
  );
};
