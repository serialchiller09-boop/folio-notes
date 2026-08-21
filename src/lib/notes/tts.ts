export type Speakable = { id: string; text: string };

export type TtsStatus = "idle" | "playing" | "paused";

type Listener = {
  onStatus?: (status: TtsStatus) => void;
  onBlock?: (blockId: string | null) => void;
};

const FEMALE_HINTS =
  /samantha|karen|moira|tessa|fiona|veena|zira|aria|jenny|sara|sonia|siri|female|google us english|microsoft (aria|jenny|zira|sara)/i;
const MALE_HINTS = /male|david|mark|guy|ryan|fred|daniel|alex\b|tom\b|ravi/i;

function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${v.lang}`.toLowerCase();
  let score = 0;
  if (/en-us|en_us|us english/.test(n)) score += 5;
  else if (/^en(-|$)/.test(v.lang.toLowerCase()) || /english/.test(n)) score += 3;
  if (FEMALE_HINTS.test(n)) score += 10;
  if (MALE_HINTS.test(n)) score -= 6;
  if (v.localService) score += 1;
  if (/compact|novelty/.test(n)) score -= 4;
  return score;
}

export function pickEnglishFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  const best = ranked[0];
  if (!best || scoreVoice(best) <= 0) {
    return voices.find((v) => /^en/i.test(v.lang)) ?? voices[0] ?? null;
  }
  return best;
}

class TtsEngine {
  private queue: Speakable[] = [];
  private index = 0;
  private rate = 1;
  private status: TtsStatus = "idle";
  private listener: Listener = {};
  private voice: SpeechSynthesisVoice | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voicesReady: Promise<void>;

  constructor() {
    this.voicesReady = new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      const done = () => {
        this.voice = pickEnglishFemaleVoice();
        resolve();
      };
      if (window.speechSynthesis.getVoices().length) {
        done();
        return;
      }
      window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
      window.setTimeout(done, 800);
    });
  }

  getStatus() {
    return this.status;
  }

  getRate() {
    return this.rate;
  }

  setListener(listener: Listener) {
    this.listener = listener;
  }

  setRate(rate: number) {
    this.rate = Math.min(1.6, Math.max(0.7, rate));
    if (this.status === "playing" && this.utterance) {
      const currentId = this.queue[this.index]?.id;
      const remaining = this.queue.slice(this.index);
      this.cancelInternal();
      if (currentId) this.start(remaining, this.rate);
    }
  }

  async ready() {
    await this.voicesReady;
    return this.voice;
  }

  start(items: Speakable[], rate = this.rate) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const cleaned = items.filter((item) => item.text.trim().length > 0);
    if (!cleaned.length) return;
    this.stop();
    this.queue = cleaned;
    this.index = 0;
    this.rate = rate;
    this.speakCurrent();
  }

  pause() {
    if (typeof window === "undefined" || this.status !== "playing") return;
    window.speechSynthesis.pause();
    this.setStatus("paused");
  }

  resume() {
    if (typeof window === "undefined" || this.status !== "paused") return;
    window.speechSynthesis.resume();
    this.setStatus("playing");
  }

  stop() {
    this.cancelInternal();
    this.queue = [];
    this.index = 0;
    this.listener.onBlock?.(null);
    this.setStatus("idle");
  }

  private cancelInternal() {
    if (typeof window === "undefined") return;
    this.utterance = null;
    window.speechSynthesis.cancel();
  }

  private setStatus(status: TtsStatus) {
    this.status = status;
    this.listener.onStatus?.(status);
  }

  private speakCurrent() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const item = this.queue[this.index];
    if (!item) {
      this.listener.onBlock?.(null);
      this.setStatus("idle");
      return;
    }
    this.voice = this.voice ?? pickEnglishFemaleVoice();
    const utter = new SpeechSynthesisUtterance(item.text);
    utter.rate = this.rate;
    utter.pitch = 1.02;
    utter.lang = this.voice?.lang || "en-US";
    if (this.voice) utter.voice = this.voice;
    utter.onstart = () => {
      this.listener.onBlock?.(item.id);
      this.setStatus("playing");
    };
    utter.onend = () => {
      if (this.utterance !== utter) return;
      this.index += 1;
      this.speakCurrent();
    };
    utter.onerror = () => {
      if (this.utterance !== utter) return;
      this.index += 1;
      this.speakCurrent();
    };
    this.utterance = utter;
    window.speechSynthesis.speak(utter);
  }
}

export const tts = new TtsEngine();
