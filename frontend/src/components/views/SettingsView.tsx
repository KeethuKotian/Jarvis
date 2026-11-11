import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  FolderCheck, 
  Save, 
  Check, 
  UserCheck,
  Mic,
  Sparkles
} from 'lucide-react';
import { speechSynthesizer } from '../../services/speechSynthesis';
import { speechRecognizer } from '../../services/speechRecognition';
import { soundEffects } from '../../services/soundEffects';

interface SettingsViewProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  voiceEnabled,
  onToggleVoice
}) => {
  const [rate, setRate] = useState<number>(speechSynthesizer.rate);
  const [pitch, setPitch] = useState<number>(speechSynthesizer.pitch);
  const [soundFx, setSoundFx] = useState<boolean>(soundEffects.enabled);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(speechSynthesizer.selectedVoice?.name || '');
  const [sttLang, setSttLang] = useState<string>(speechRecognizer.language);
  const [neuralSTT, setNeuralSTT] = useState<boolean>(speechRecognizer.neuralEnhancement);

  useEffect(() => {
    const list = speechSynthesizer.loadVoices();
    setAvailableVoices(list);
    if (speechSynthesizer.selectedVoice) {
      setSelectedVoiceName(speechSynthesizer.selectedVoice.name);
    }
  }, []);

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    speechSynthesizer.setVoiceByName(voiceName);
  };

  const handleSave = () => {
    speechSynthesizer.rate = rate;
    speechSynthesizer.pitch = pitch;
    soundEffects.enabled = soundFx;
    if (selectedVoiceName) {
      speechSynthesizer.setVoiceByName(selectedVoiceName);
    }
    speechRecognizer.setLanguage(sttLang);
    speechRecognizer.neuralEnhancement = neuralSTT;
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const testVoice = () => {
    speechSynthesizer.rate = rate;
    speechSynthesizer.pitch = pitch;
    if (selectedVoiceName) {
      speechSynthesizer.setVoiceByName(selectedVoiceName);
    }
    speechSynthesizer.speak("Audio output systems initialized. Voice synthesis calibrated to masculine baritone frequency, sir.");
  };

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="font-display glow-cyan" style={{ fontSize: '20px', color: 'var(--cyan-primary)', margin: 0 }}>
            SETTINGS &amp; PRIVACY CONFIGURATION
          </h2>
          <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Control masculine speech synthesis profile, sound effects, and local privacy boundaries.
          </p>
        </div>

        <button className="btn-hud" onClick={handleSave}>
          <Save size={15} />
          <span>SAVE PREFERENCES</span>
        </button>
      </div>

      {savedNotice && (
        <div 
          className="hud-panel font-mono" 
          style={{ 
            padding: '10px 16px', 
            marginBottom: '20px', 
            color: 'var(--green-online)', 
            borderColor: 'var(--green-online)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Check size={16} />
          <span>Configuration preferences updated and applied.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Voice & Audio Preferences */}
        <div className="hud-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Volume2 size={18} color="var(--cyan-primary)" />
            <h3 className="font-display glow-cyan" style={{ fontSize: '15px', color: 'var(--cyan-primary)', margin: 0 }}>
              MALE VOICE &amp; SYNTHESIS CONTROLS
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Spoken Responses Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)' }}>SPOKEN RESPONSES (TTS)</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Speak assistant responses aloud</div>
              </div>
              <button 
                className={`btn-hud ${voiceEnabled ? '' : 'btn-hud-secondary'}`}
                onClick={onToggleVoice}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                {voiceEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            {/* Voice Profile Selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }} className="font-mono">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MALE VOICE PROFILE</span>
                <span style={{ fontSize: '11px', color: 'var(--cyan-primary)' }}>
                  {speechSynthesizer.isMaleVoice({ name: selectedVoiceName, lang: 'en' } as any) ? '[MASCULINE]' : ''}
                </span>
              </div>
              <select
                value={selectedVoiceName}
                onChange={(e) => handleVoiceChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#070d20',
                  border: '1px solid var(--border-cyan)',
                  padding: '9px 12px',
                  color: 'var(--text-main)',
                  borderRadius: '4px',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              >
                {availableVoices
                  .filter(v => v.lang.startsWith('en'))
                  .map((v) => {
                    const isMale = speechSynthesizer.isMaleVoice(v);
                    return (
                      <option key={v.name} value={v.name}>
                        {isMale ? '✓ [MALE] ' : ''}{v.name} ({v.lang})
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }} className="font-mono">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CADENCE / RATE</span>
                <span style={{ fontSize: '12px', color: 'var(--cyan-primary)' }}>{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.02"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>

            {/* Speech Pitch Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }} className="font-mono">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>BARITONE PITCH (JARVIS TONE)</span>
                <span style={{ fontSize: '12px', color: 'var(--cyan-primary)' }}>{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.15"
                step="0.02"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>

            {/* Web Audio Sound FX */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)' }}>HOLOGRAPHIC SOUND FX</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Sci-fi UI chirps and action tones</div>
              </div>
              <button 
                className={`btn-hud ${soundFx ? '' : 'btn-hud-secondary'}`}
                onClick={() => setSoundFx(!soundFx)}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                {soundFx ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <button className="btn-hud btn-hud-secondary" onClick={testVoice} style={{ fontSize: '11px', marginTop: '6px' }}>
              <UserCheck size={14} />
              <span>TEST MASCULINE JARVIS VOICE</span>
            </button>
          </div>
        </div>

        {/* Speech Recognition & Accent Calibration */}
        <div className="hud-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Mic size={18} color="var(--cyan-primary)" />
            <h3 className="font-display glow-cyan" style={{ fontSize: '15px', color: 'var(--cyan-primary)', margin: 0 }}>
              SPEECH RECOGNITION &amp; ACCENT
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Neural STT Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-display" style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color="var(--purple-ai)" />
                  NEURAL GEMINI STT (WHISPER-GRADE)
                </div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Multimodal audio transcription for complex sentences &amp; accents
                </div>
              </div>
              <button 
                className={`btn-hud ${neuralSTT ? '' : 'btn-hud-secondary'}`}
                onClick={() => setNeuralSTT(!neuralSTT)}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                {neuralSTT ? 'ACTIVE' : 'LOCAL ONLY'}
              </button>
            </div>

            {/* Input Dialect / Accent Selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }} className="font-mono">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RECOGNITION ACCENT / DIALECT</span>
                <span style={{ fontSize: '11px', color: 'var(--cyan-primary)' }}>[{sttLang}]</span>
              </div>
              <select
                value={sttLang}
                onChange={(e) => {
                  setSttLang(e.target.value);
                  speechRecognizer.setLanguage(e.target.value);
                }}
                style={{
                  width: '100%',
                  background: '#070d20',
                  border: '1px solid var(--border-cyan)',
                  padding: '9px 12px',
                  color: 'var(--text-main)',
                  borderRadius: '4px',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              >
                <option value="en-IN">English (India) — en-IN</option>
                <option value="en-US">English (United States) — en-US</option>
                <option value="en-GB">English (United Kingdom) — en-GB</option>
                <option value="en-AU">English (Australia) — en-AU</option>
                <option value="en-CA">English (Canada) — en-CA</option>
              </select>
            </div>

            <div 
              className="font-mono"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                padding: '10px 12px',
                background: 'rgba(0, 240, 255, 0.03)',
                border: '1px solid rgba(0, 240, 255, 0.1)',
                borderRadius: '4px'
              }}
            >
              • <strong>Real-Time Preview</strong> displays instant typing preview via local Web Speech.<br/>
              • <strong>Neural Cloud STT</strong> refines full sentences upon release using Gemini multimodal audio for zero dropped words.
            </div>
          </div>
        </div>

        {/* Security & Directory Sandboxing */}
        <div className="hud-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <FolderCheck size={18} color="var(--purple-ai)" />
            <h3 className="font-display glow-purple" style={{ fontSize: '15px', color: 'var(--purple-ai)', margin: 0 }}>
              SECURITY SANDBOX DIRECTORIES
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            File searches and document extraction are strictly confined to user-approved locations. Traversal attempts outside these paths are rejected.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="font-mono">
            {[
              'D:\\projects\\Jarvis (Project Root)',
              'C:\\Users\\keert\\Documents (User Documents)',
              'C:\\Users\\keert\\Downloads (Downloads Cache)'
            ].map((dir, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: '10px 12px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--cyan-dim)'
                }}
              >
                ✓ ALLOWED: {dir}
              </div>
            ))}
          </div>

          <div 
            style={{ 
              marginTop: '16px', 
              padding: '10px 12px', 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid var(--red-alert)', 
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--red-alert)'
            }}
            className="font-mono"
          >
            RESTRICTED: Windows System32, Program Files, AppData, and Arbitrary Shell Execution are permanently blocked.
          </div>
        </div>
      </div>
    </div>
  );
};
