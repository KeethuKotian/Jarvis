export class JarvisSpeechRecognizer {
  private recognition: any = null;
  public isListening: boolean = false;
  private accumulatedText: string = '';
  private currentInterimText: string = '';
  private silenceTimer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  public language: string = 'en-US';
  public neuralEnhancement: boolean = true;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // Auto-detect browser/system locale
    const detectedLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
    this.language = detectedLang.startsWith('en') ? detectedLang : 'en-US';

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 3;
    }
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null || (typeof navigator !== 'undefined' && !!navigator.mediaDevices);
  }

  public postProcessTranscript(text: string): string {
    if (!text) return '';
    let cleaned = text.trim();

    // Map common speech acoustic mishearings to precise assistant keywords
    const replacements: [RegExp, string][] = [
      [/\bnote\s*pad\b/gi, 'notepad'],
      [/\b(v\s*s\s*code|visual\s*studio\s*code|we\s*s\s*code|vs\s*code)\b/gi, 'vs code'],
      [/\b(c\s*drive|see\s*drive|sea\s*drive|c:\s*drive)\b/gi, 'c drive'],
      [/\b(d\s*drive|dee\s*drive|the\s*drive|d:\s*drive)\b/gi, 'd drive'],
      [/\b(word\s*pad)\b/gi, 'wordpad'],
      [/\b(task\s*man|task\s*manager|taskmgr)\b/gi, 'task manager'],
      [/\b(power\s*shell)\b/gi, 'powershell'],
      [/\b(calc|calci)\b/gi, 'calculator'],
      [/\b(file\s*explorer|explor\w*)\b/gi, 'explorer'],
      [/\b(command\s*prompt|cmd\s*prompt)\b/gi, 'command prompt'],
      [/\b(text\s*file|txt\s*file)\b/gi, 'txt file'],
      [/\b(chrome\s*browser)\b/gi, 'chrome'],
      [/\bplz\b/gi, 'please']
    ];

    for (const [pattern, replacement] of replacements) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned;
  }

  public async start(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (this.isListening) {
      await this.stopAndTranscribe();
    }

    this.isListening = true;
    this.accumulatedText = '';
    this.currentInterimText = '';
    this.audioChunks = [];

    // 1. Initialize high-definition MediaRecorder with noise suppression
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };
        recorder.start(100);
        this.mediaRecorder = recorder;
      }
    } catch (e: any) {
      console.warn('MediaRecorder audio stream init notice:', e);
    }

    // 2. Initialize Web Speech API
    if (this.recognition) {
      // Re-apply language in case it changed
      this.recognition.lang = this.language;

      this.recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';

        // Reconstruct full result across all results up to length to prevent dropped/repeated chunks
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }

        this.accumulatedText = final.trim();
        this.currentInterimText = interim.trim();

        const display = (this.accumulatedText + ' ' + this.currentInterimText).trim();
        if (display) {
          onInterim(this.postProcessTranscript(display));

          // Reset silence timer: if user stops speaking for 2.4 seconds, auto-submit
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.isListening) {
              this.flushAndSubmit(onFinal, onEnd);
            }
          }, 2400);
        }
      };

      this.recognition.onerror = async (event: any) => {
        const errorType = event.error || 'speech-error';
        console.warn('Speech recognition notice:', errorType);

        if (errorType === 'not-allowed') {
          this.isListening = false;
          onError('Microphone access denied. Please click the camera/mic icon in your browser address bar and choose "Allow".');
          onEnd();
          return;
        }

        if (errorType === 'no-speech') {
          // Keep listening until user releases or speaks
          return;
        }

        // If Web Speech API had an error, try neural transcription if audio was captured
        if (this.audioChunks.length > 0 && !this.accumulatedText.trim()) {
          const cloudTranscript = await this.transcribeAudioWithCloud();
          if (cloudTranscript) {
            this.isListening = false;
            onFinal(cloudTranscript);
            onEnd();
            return;
          }
        }

        onError(`Speech detection note: ${errorType}`);
      };

      this.recognition.onend = async () => {
        if (this.isListening) {
          this.flushAndSubmit(onFinal, onEnd);
        }
      };

      try {
        this.recognition.start();
      } catch (err: any) {
        console.warn('Web Speech start error:', err);
      }
    }
  }

  public async transcribeAudioWithCloud(): Promise<string> {
    if (this.audioChunks.length === 0) return '';
    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      if (audioBlob.size < 400) return '';

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // AbortController with 3.5s timeout for zero UI freeze
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch('http://localhost:8000/api/voice/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.transcript) {
          return this.postProcessTranscript(json.transcript.trim());
        }
      }
    } catch (e) {
      console.info('Neural cloud transcription fallback note:', e);
    }
    return '';
  }

  private async flushAndSubmit(onFinal: (text: string) => void, onEnd: () => void) {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const localResult = (this.accumulatedText + ' ' + this.currentInterimText).trim();
    this.accumulatedText = '';
    this.currentInterimText = '';
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    const hadAudio = this.audioChunks.length > 0;
    this.stopRecorder();

    let finalText = '';
    // 1. Prioritize high-accuracy Neural Gemini STT if enabled
    if (this.neuralEnhancement && hadAudio) {
      const cloudResult = await this.transcribeAudioWithCloud();
      if (cloudResult && cloudResult.length >= 2) {
        finalText = cloudResult;
      }
    }

    // 2. Fall back to processed local Web Speech result
    if (!finalText && localResult) {
      finalText = this.postProcessTranscript(localResult);
    }

    if (finalText) {
      onFinal(finalText);
    }
    onEnd();
  }

  private stopRecorder() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Ignore
      }
    }
    this.mediaRecorder = null;
  }

  public async stopAndTranscribe(): Promise<string> {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const localResult = (this.accumulatedText + ' ' + this.currentInterimText).trim();
    this.accumulatedText = '';
    this.currentInterimText = '';
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    const hadAudio = this.audioChunks.length > 0;
    this.stopRecorder();

    // 1. Try high-accuracy Neural Gemini STT
    if (this.neuralEnhancement && hadAudio) {
      const cloudResult = await this.transcribeAudioWithCloud();
      if (cloudResult && cloudResult.length >= 2) {
        return cloudResult;
      }
    }

    // 2. Fall back to post-processed local Web Speech transcript
    return this.postProcessTranscript(localResult);
  }

  public stop(): string {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const final = (this.accumulatedText + ' ' + this.currentInterimText).trim();
    this.accumulatedText = '';
    this.currentInterimText = '';
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    this.stopRecorder();
    return this.postProcessTranscript(final);
  }
}

export const speechRecognizer = new JarvisSpeechRecognizer();
