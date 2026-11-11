export class JarvisSpeechSynthesizer {
  private synth: SpeechSynthesis | null = null;
  public selectedVoice: SpeechSynthesisVoice | null = null;
  public enabled: boolean = true;
  public rate: number = 1.02;
  public pitch: number = 0.88; // Refined baritone pitch for JARVIS

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public isMaleVoice(voice: SpeechSynthesisVoice): boolean {
    const name = voice.name.toLowerCase();
    const femaleNames = [
      'female', 'zira', 'hazel', 'susan', 'catherine', 'jenny', 'aria',
      'samantha', 'victoria', 'karen', 'linda', 'helena', 'elena', 'eva'
    ];
    for (const f of femaleNames) {
      if (name.includes(f)) return false;
    }
    const maleHints = ['male', 'george', 'david', 'mark', 'daniel', 'oliver', 'guy', 'james', 'arthur', 'brian', 'richard'];
    for (const m of maleHints) {
      if (name.includes(m)) return true;
    }
    // If English and not explicitly female, check if Windows standard male
    return voice.lang.startsWith('en');
  }

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return [];

    // Filter English voices
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));

    // Priority 1: British Male (George / UK Male / Daniel)
    const britishMale = englishVoices.find(v => {
      const n = v.name.toLowerCase();
      return (n.includes('george') || n.includes('daniel') || (n.includes('uk') && n.includes('male'))) && this.isMaleVoice(v);
    });

    // Priority 2: Standard Windows English Male (David / Mark)
    const windowsMale = englishVoices.find(v => {
      const n = v.name.toLowerCase();
      return (n.includes('david') || n.includes('mark') || n.includes('male')) && this.isMaleVoice(v);
    });

    // Priority 3: Any English voice that is male
    const anyMale = englishVoices.find(v => this.isMaleVoice(v));

    this.selectedVoice = britishMale || windowsMale || anyMale || englishVoices[0] || voices[0];
    return voices;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public setVoiceByName(voiceName: string) {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    const match = voices.find(v => v.name === voiceName);
    if (match) {
      this.selectedVoice = match;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ) {
    if (!this.enabled || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any active speech to prevent overlapping
    this.stop();

    // Strip markdown formatting symbols (*, #, `, _, bullet points)
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/•/g, '')
      .replace(/http\S+/g, 'link')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    if (!this.selectedVoice) {
      this.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      if (onError) onError(e.error);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }
}

export const speechSynthesizer = new JarvisSpeechSynthesizer();
