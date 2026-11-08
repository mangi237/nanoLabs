export type VoiceState = 'off' | 'starting' | 'listening' | 'thinking' | 'speaking' | 'error';
export interface Recognition { continuous: boolean; interimResults: boolean; lang: string; onstart?: (() => void) | null; onresult: ((event: any) => void) | null; onend: (() => void) | null; onerror: ((event: any) => void) | null; start(): void; abort(): void; }
/** One microphone owner. Recognition is stopped before network work or speech playback. */
export class VoiceSession {
  active = false;
  private generation = 0;
  private recognizer: Recognition | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private startup: ReturnType<typeof setTimeout> | undefined;
  constructor(private deps: { recognition: () => Recognition; speak: (text: string) => Promise<void>; cancelSpeech: () => void; ask: (text: string) => Promise<string>; state: (state: VoiceState, error?: string) => void; delay?: number }) {}
  start() { if (this.active) return; this.active = true; this.generation++; this.listen(this.generation); }
  stop() { this.active = false; this.generation++; clearTimeout(this.timer); clearTimeout(this.startup); const recognition = this.recognizer; this.recognizer = null; if (recognition) { recognition.onstart = null; recognition.onend = null; recognition.onresult = null; recognition.onerror = null; recognition.abort(); } this.deps.cancelSpeech(); this.deps.state('off'); }
  private fail(message: string) { this.stop(); this.deps.state('error', message); }
  private listen(generation: number) {
    if (!this.active || this.generation !== generation) return;
    try {
      const recognition = this.deps.recognition(); this.recognizer = recognition;
      recognition.continuous = true; recognition.interimResults = false; recognition.lang = navigator.language || 'en-US';
      let handled = false;
      recognition.onstart = () => { if (this.active && generation === this.generation) { clearTimeout(this.startup); this.deps.state('listening'); } };
      recognition.onresult = async event => {
        if (handled || generation !== this.generation) return;
        const text = Array.from(event.results as any[]).slice(event.resultIndex).filter((r: any) => r.isFinal).map((r: any) => r[0].transcript).join(' ').trim();
        if (!text) return;
        handled = true; recognition.onend = null; recognition.onerror = null; recognition.abort(); this.recognizer = null;
        this.deps.state('thinking');
        try {
          const answer = await this.deps.ask(text);
          if (!this.active || generation !== this.generation) return;
          this.deps.state('speaking'); await this.deps.speak(answer);
          if (this.active && generation === this.generation) this.listen(generation);
        } catch (error) { if (generation === this.generation) this.fail(error instanceof Error ? error.message : 'Voice conversation failed. Please restart.'); }
      };
      recognition.onerror = event => { if (generation !== this.generation) return; if (event.error === 'no-speech') return; this.fail(`Voice input failed (${event.error}). Check microphone permission and restart.`); };
      recognition.onend = () => { clearTimeout(this.startup); if (this.recognizer === recognition) this.recognizer = null; if (!handled && this.active && generation === this.generation) this.timer = setTimeout(() => this.listen(generation), this.deps.delay ?? 300); };
      this.deps.state('starting');
      this.startup = setTimeout(() => { if (this.active && generation === this.generation) this.fail('Voice recognition did not start. Check browser microphone access and restart.'); }, 10000);
      recognition.start();
    } catch (error) { this.fail(error instanceof Error ? error.message : 'Voice input could not start.'); }
  }
}
