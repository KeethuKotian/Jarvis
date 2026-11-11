import React, { useState, useEffect, useCallback } from 'react';
import { 
  AssistantState, 
  NavigationTab, 
  ChatMessage, 
  HealthStatus, 
  DiagnosticsData 
} from './types';
import { api } from './services/api';
import { speechRecognizer } from './services/speechRecognition';
import { speechSynthesizer } from './services/speechSynthesis';
import { soundEffects } from './services/soundEffects';

import { HeaderHUD } from './components/HeaderHUD';
import { SidebarNav } from './components/SidebarNav';
import { CommandBar } from './components/CommandBar';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';

import { CommandCenterView } from './components/views/CommandCenterView';
import { ToolsView } from './components/views/ToolsView';
import { FileSearchView } from './components/views/FileSearchView';
import { RemindersView } from './components/views/RemindersView';
import { MemoryView } from './components/views/MemoryView';
import { MLDiagnosticsView } from './components/views/MLDiagnosticsView';
import { SystemStatusView } from './components/views/SystemStatusView';
import { SettingsView } from './components/views/SettingsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('command_center');
  const [assistantState, setAssistantState] = useState<AssistantState>('IDLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [latestDiagnostics, setLatestDiagnostics] = useState<DiagnosticsData | null>(null);

  // Modals & Panels
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: string;
    originalMessage: string;
  }>({ isOpen: false, action: '', originalMessage: '' });

  // Voice Interaction State
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  // Fetch initial subsystem health
  const refreshHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth({
        status: 'OFFLINE',
        system: 'JARVIS AI',
        environment: 'local',
        database_connected: false,
        ml_classifier_loaded: false,
        gemini_status: 'UNAVAILABLE',
        gemini_model: 'gemini-3.8-flash',
        telemetry: { cpu_percent: 0, ram_percent: 0, ram_used_gb: 0, ram_total_gb: 0 }
      });
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 10000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Handle Transmitting Directives
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    soundEffects.playWakeChirp();
    const userTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: userTimestamp
    };

    setMessages((prev) => [...prev, userMsg]);
    setAssistantState('THINKING');

    try {
      const res = await api.sendMessage(text, {
        voiceEnabled: voiceEnabled
      });

      if (res.tool_used) {
        soundEffects.playToolExecution();
        setAssistantState('EXECUTING');
      }

      setLatestDiagnostics(res.diagnostics);

      // Check if action requires consequential confirmation
      if (res.requires_confirmation) {
        soundEffects.playAlertChime();
        setConfirmationModal({
          isOpen: true,
          action: res.confirmation_action || 'system_action',
          originalMessage: text
        });
      }

      const assistantTimestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        timestamp: assistantTimestamp,
        intent: res.intent,
        confidence: res.confidence,
        routing: res.routing,
        tool_used: res.tool_used,
        tool_result: res.tool_result,
        diagnostics: res.diagnostics,
        requires_confirmation: res.requires_confirmation,
        confirmation_action: res.confirmation_action
      };

      setMessages((prev) => [...prev, assistantMsg]);
      soundEffects.playResponseShimmer();

      // Speak aloud if voice enabled
      if (voiceEnabled && res.reply) {
        setAssistantState('SPEAKING');
        speechSynthesizer.speak(
          res.reply,
          () => setAssistantState('SPEAKING'),
          () => setAssistantState('IDLE'),
          () => setAssistantState('IDLE')
        );
      } else {
        setAssistantState('IDLE');
      }
    } catch (err: any) {
      setAssistantState('ERROR');
      soundEffects.playAlertChime();
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, sir. A subsystem failure occurred: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      };
      setMessages((prev) => [...prev, errorMsg]);
      setTimeout(() => setAssistantState('IDLE'), 3500);
    }
  };

  // Push-To-Talk Voice Controls
  const startListening = () => {
    soundEffects.playWakeChirp();
    setIsListening(true);
    setAssistantState('LISTENING');
    setInterimTranscript('');

    speechRecognizer.start(
      (interim) => {
        setInterimTranscript(interim);
      },
      (final) => {
        setIsListening(false);
        setInterimTranscript('');
        handleSendMessage(final);
      },
      (err) => {
        setIsListening(false);
        setInterimTranscript('');
        setAssistantState('ERROR');
        soundEffects.playAlertChime();
        setTimeout(() => setAssistantState('IDLE'), 2500);
      },
      () => {
        setIsListening(false);
        setInterimTranscript('');
        if (assistantState === 'LISTENING') {
          setAssistantState('IDLE');
        }
      }
    );
  };

  const stopListening = async () => {
    setIsListening(false);
    setAssistantState('THINKING');
    const text = await speechRecognizer.stopAndTranscribe();
    setInterimTranscript('');
    if (text) {
      handleSendMessage(text);
    } else {
      setAssistantState('IDLE');
    }
  };

  // Consequential Action Confirmation Handlers
  const handleConfirmAction = async () => {
    const { action, originalMessage } = confirmationModal;
    setConfirmationModal({ isOpen: false, action: '', originalMessage: '' });
    soundEffects.playToolExecution();
    setAssistantState('EXECUTING');

    try {
      const res = await api.confirmAction(action, originalMessage);
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: res.reply || 'Authorized action confirmed and completed, sir.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        tool_used: res.tool_used
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (voiceEnabled && res.reply) {
        setAssistantState('SPEAKING');
        speechSynthesizer.speak(res.reply, undefined, () => setAssistantState('IDLE'));
      } else {
        setAssistantState('IDLE');
      }
    } catch (err: any) {
      setAssistantState('ERROR');
      alert(`Action execution failed: ${err.message}`);
    }
  };

  const handleCancelAction = () => {
    setConfirmationModal({ isOpen: false, action: '', originalMessage: '' });
    const cancelMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Action aborted by operator command, sir.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setMessages((prev) => [...prev, cancelMsg]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)'
      }}
    >
      {/* Top Futuristic Header HUD */}
      <HeaderHUD
        health={health}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => {
          const next = !voiceEnabled;
          setVoiceEnabled(next);
          speechSynthesizer.enabled = next;
          if (!next) speechSynthesizer.stop();
        }}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Main Docking Layout: Sidebar Nav + Primary Viewport */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SidebarNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            soundEffects.playToolExecution();
            setActiveTab(tab);
          }}
        />

        {/* Viewport Area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'command_center' && (
              <CommandCenterView
                state={assistantState}
                messages={messages}
                isListening={isListening}
                onQuickAction={handleSendMessage}
                onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
              />
            )}

            {activeTab === 'chat_history' && (
              <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
                <h2 className="font-display glow-cyan" style={{ fontSize: '20px', color: 'var(--cyan-primary)', marginBottom: '16px' }}>
                  SESSION CONVERSATION LOGS
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {messages.map((m) => (
                    <div key={m.id} className="hud-panel" style={{ padding: '14px' }}>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                        [{m.timestamp}] {m.role.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <ToolsView onRequestLockConfirmation={() => {
                soundEffects.playAlertChime();
                setConfirmationModal({
                  isOpen: true,
                  action: 'lock',
                  originalMessage: 'Lock Workstation'
                });
              }} />
            )}

            {activeTab === 'file_search' && <FileSearchView />}

            {activeTab === 'reminders' && <RemindersView />}

            {activeTab === 'memory' && <MemoryView />}

            {activeTab === 'ml_diagnostics' && <MLDiagnosticsView />}

            {activeTab === 'system_status' && (
              <SystemStatusView health={health} onRefreshHealth={refreshHealth} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  speechSynthesizer.enabled = next;
                  if (!next) speechSynthesizer.stop();
                }}
              />
            )}
          </div>

          {/* Bottom Command Dock Bar (Always Accessible) */}
          <CommandBar
            onSendMessage={handleSendMessage}
            assistantState={assistantState}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
            interimTranscript={interimTranscript}
          />
        </main>
      </div>

      {/* Developer Diagnostics Slide-over Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        latestDiagnostics={latestDiagnostics}
      />

      {/* Consequential Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        action={confirmationModal.action}
        originalMessage={confirmationModal.originalMessage}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </div>
  );
};

export default App;
