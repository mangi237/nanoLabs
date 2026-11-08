import { VoiceSession, type Recognition, type VoiceState } from './voiceSession';
/** Native browser adapters shared by the app and the real-audio browser QA page. */
export function browserVoiceSession(options: { ask: (text: string) => Promise<string>; state: (state: VoiceState, error?: string) => void; inputTrack?: MediaStreamTrack }) {
  const Constructor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  if (!Constructor || !window.speechSynthesis) throw new Error('Hands-free voice is unavailable in this browser. Use text chat or open a browser with speech recognition.');
  // Initialize native voice discovery during the user's Start gesture, before the AI round trip.
  window.speechSynthesis.getVoices();
  return new VoiceSession({
    ask: options.ask,
    state: options.state,
    recognition: () => {
      const recognition = new Constructor();
      if (import.meta.env.DEV) for (const type of ['start','audiostart','speechstart','speechend','audioend','end','error','result']) recognition.addEventListener(type, (event: any) => console.debug('[voice native]', type, event.error ?? ''));
      if (options.inputTrack) {
        // Real audio track recognition, not injected transcripts or mocked result events.
        const start = recognition.start.bind(recognition);
        recognition.start = () => start(options.inputTrack);
      }
      return recognition as Recognition;
    },
    cancelSpeech: () => window.speechSynthesis.cancel(),
    speak: browserSpeak,
  });
}

export function browserSpeak(text: string) { return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      let startedAt: number | undefined;
      utterance.onstart = event => { startedAt = performance.now(); if (import.meta.env.DEV) window.dispatchEvent(new CustomEvent('nanolabs_voice_playback', { detail: { stage: 'start', elapsedTime: event.elapsedTime, at: startedAt } })); };
      utterance.onend = event => { if (import.meta.env.DEV) window.dispatchEvent(new CustomEvent('nanolabs_voice_playback', { detail: { stage: 'end', elapsedTime: event.elapsedTime, charIndex: event.charIndex, at: performance.now() } })); if (startedAt === undefined || performance.now() - startedAt < 50) { reject(new Error('Spoken playback ended before audio could play. Check browser audio and restart voice.')); return; } resolve(); };
      utterance.onerror = () => reject(new Error('Spoken playback failed. Your answer is visible in chat.'));
      window.speechSynthesis.speak(utterance);
    }); }
