/**
 * Tiny WebAudio synth. No asset files, no loading time, works offline.
 * All sounds are envelopes over oscillators (or a short noise burst).
 */

type Voice = {
  type: OscillatorType;
  f0: number;
  f1?: number;
  dur: number;
  gain: number;
  delay?: number;
};

const VOICES: Record<string, Voice[]> = {
  key: [{ type: 'square', f0: 720, dur: 0.028, gain: 0.028 }],
  move: [{ type: 'sine', f0: 520, dur: 0.02, gain: 0.02 }],
  del: [
    { type: 'sawtooth', f0: 260, f1: 90, dur: 0.09, gain: 0.05 },
    { type: 'sine', f0: 120, dur: 0.05, gain: 0.03 },
  ],
  ins: [{ type: 'triangle', f0: 940, dur: 0.025, gain: 0.025 }],
  yank: [
    { type: 'triangle', f0: 880, dur: 0.05, gain: 0.04 },
    { type: 'triangle', f0: 1320, dur: 0.05, gain: 0.03, delay: 0.045 },
  ],
  coin: [
    { type: 'sine', f0: 880, dur: 0.09, gain: 0.05 },
    { type: 'sine', f0: 1318, dur: 0.12, gain: 0.04, delay: 0.07 },
  ],
  star: [
    { type: 'triangle', f0: 1046, dur: 0.16, gain: 0.05 },
    { type: 'triangle', f0: 1318, dur: 0.16, gain: 0.045, delay: 0.1 },
    { type: 'triangle', f0: 1568, dur: 0.22, gain: 0.04, delay: 0.2 },
  ],
  win: [
    { type: 'sine', f0: 523, dur: 0.5, gain: 0.05 },
    { type: 'sine', f0: 659, dur: 0.5, gain: 0.045, delay: 0.06 },
    { type: 'sine', f0: 784, dur: 0.7, gain: 0.04, delay: 0.12 },
    { type: 'sine', f0: 1046, dur: 0.8, gain: 0.03, delay: 0.2 },
  ],
  hurt: [{ type: 'sawtooth', f0: 160, f1: 40, dur: 0.25, gain: 0.08 }],
  locked: [{ type: 'square', f0: 110, dur: 0.09, gain: 0.05 }],
  undo: [{ type: 'sine', f0: 320, f1: 520, dur: 0.1, gain: 0.03 }],
  open: [{ type: 'sine', f0: 300, f1: 600, dur: 0.18, gain: 0.03 }],
};

const MUTE_KEY = 'vimlore.sound';

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  constructor() {
    try {
      this.enabled = localStorage.getItem(MUTE_KEY) !== '0';
    } catch {
      /* private mode */
    }
  }

  /** Must be called from a user gesture. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    try {
      localStorage.setItem(MUTE_KEY, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  play(name: keyof typeof VOICES | string, detune = 0): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const voices = VOICES[name];
    if (!voices) return;
    const now = this.ctx.currentTime;
    for (const v of voices) {
      const t = now + (v.delay ?? 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = v.type;
      osc.frequency.setValueAtTime(v.f0 * (1 + detune), t);
      if (v.f1 !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1 * (1 + detune)), t + v.dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v.gain, t + Math.min(0.012, v.dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + v.dur + 0.02);
    }
  }

  /** A soft tick that rises with the line number, so typing has pitch. */
  tick(line: number): void {
    this.play('key', Math.min(0.25, line * 0.012));
  }
}
