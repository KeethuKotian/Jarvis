import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { AssistantState } from '../types';

interface CommandBarProps {
  onSendMessage: (text: string) => void;
  assistantState: AssistantState;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  interimTranscript?: string;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onSendMessage,
  assistantState,
  isListening,
  onStartListening,
  onStopListening,
  interimTranscript
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync interim transcript into input field so user sees words typed as they speak
  useEffect(() => {
    if (isListening && interimTranscript) {
      setInput(interimTranscript);
    }
  }, [isListening, interimTranscript]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || assistantState === 'THINKING' || assistantState === 'EXECUTING') return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        padding: '12px 24px 20px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(4, 8, 20, 0.95) 40%, #040814 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {/* Interim Live Voice Transcription Banner */}
      {isListening && (
        <div 
          className="font-mono badge-hud badge-cyan"
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            animation: 'corePulse 1.5s infinite',
            maxWidth: '650px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderColor: 'var(--cyan-primary)'
          }}
        >
          <Sparkles size={14} color="var(--cyan-primary)" />
          <span>
            {interimTranscript 
              ? `HEARING: "${interimTranscript}"` 
              : 'LISTENING... Speak your command clearly (e.g. "open chrome", "open vs code")'}
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="hud-panel"
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 10px',
          gap: '10px',
          background: 'rgba(8, 16, 36, 0.85)',
          border: isListening ? '1px solid var(--red-alert)' : '1px solid var(--border-cyan)',
          boxShadow: isListening ? '0 0 25px var(--red-glow)' : 'var(--hud-shadow)'
        }}
      >
        {/* Push-To-Talk Microphone Button */}
        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          className={`btn-hud ${isListening ? 'btn-hud-danger' : ''}`}
          style={{
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            padding: 0,
            flexShrink: 0,
            boxShadow: isListening ? '0 0 22px var(--red-glow)' : undefined
          }}
          title={isListening ? 'Stop & Transmit Directive' : 'Click to Speak (Push-To-Talk)'}
        >
          {isListening ? (
            <MicOff size={22} color="#fff" />
          ) : (
            <Mic size={22} color="var(--cyan-primary)" />
          )}
        </button>

        {/* Text Input Console */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={assistantState === 'THINKING' || assistantState === 'EXECUTING'}
          placeholder={isListening ? "Listening to your voice... Click red mic button to transmit" : "Enter directive (e.g. 'open chrome', 'open vs code', 'remind me at 5pm')..."}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '15px',
            fontFamily: 'var(--font-body)',
            padding: '10px 4px'
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || assistantState === 'THINKING' || assistantState === 'EXECUTING'}
          className="btn-hud"
          style={{
            padding: '10px 18px',
            borderRadius: '4px',
            flexShrink: 0
          }}
        >
          <Send size={15} />
          <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } } as any}>SEND</span>
        </button>
      </form>

      {/* Keyboard Shortcut Hints */}
      <div 
        className="font-mono" 
        style={{ 
          fontSize: '11px', 
          color: 'var(--text-dim)', 
          display: 'flex', 
          gap: '16px' 
        }}
      >
        <span>PRESS [ENTER] TO TRANSMIT</span>
        <span>•</span>
        <span>CLICK MIC ICON TO SPEAK</span>
        <span>•</span>
        <span>MALE JARVIS VOICE ACTIVE</span>
      </div>
    </div>
  );
};
