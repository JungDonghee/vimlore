import { Vim, type VimEvent } from '../vim/engine.ts';
import { ESC } from '../vim/keys.ts';
import { checkGoal } from './goals.ts';
import type { Stage, Stars } from './types.ts';

export type SessionEvent =
  | { type: 'key'; key: string }
  | { type: 'win'; stars: Stars; keys: number; par: number }
  | { type: 'damage'; hearts: number; char: string }
  | { type: 'lost' }
  | { type: 'locked'; key: string; message: string }
  | { type: 'message'; text: string; level: 'info' | 'error' | 'good' }
  | { type: 'vim'; event: VimEvent };

/** Keys that are never gated: the alphabet of "just moving around". */
export const UNIVERSAL_KEYS = new Set(['h', 'j', 'k', 'l', ESC, 'u', '<C-r>', '<Del>']);

export function parseStart(text: string, startChar = ' '): { text: string; line: number; col: number } {
  const at = text.indexOf('@');
  if (at < 0) return { text, line: 0, col: 0 };
  const before = text.slice(0, at);
  const line = before.split('\n').length - 1;
  const col = before.length - (before.lastIndexOf('\n') + 1);
  return { text: text.slice(0, at) + startChar + text.slice(at + 1), line, col };
}

/**
 * One play of one stage: owns the Vim instance, the keystroke counter, hearts,
 * hazards and the win condition.
 */
export class Session {
  vim: Vim;
  stage: Stage;
  chapterIndex: number;
  keys = 0;
  hearts: number;
  maxHearts: number;
  status: 'playing' | 'won' | 'lost' = 'playing';
  damage = 0;
  spent = new Set<number>();
  collected = new Set<number>();
  allowed: Set<string>;
  onEvent?: (e: SessionEvent) => void;
  startedAt = performance.now();
  hazardChars: string;

  constructor(opts: { stage: Stage; chapterIndex: number; allowed: Set<string>; onEvent?: (e: SessionEvent) => void }) {
    this.stage = opts.stage;
    this.chapterIndex = opts.chapterIndex;
    this.allowed = opts.allowed;
    this.onEvent = opts.onEvent;
    const start = parseStart(opts.stage.text, opts.stage.startChar);
    this.hazardChars = opts.stage.hazard ?? '~';
    this.maxHearts = opts.stage.hearts ?? 3;
    this.hearts = this.maxHearts;
    this.vim = new Vim({
      text: start.text,
      cursor: { line: start.line, col: start.col },
      textwidth: opts.stage.textwidth ?? 40,
      onEvent: (e) => this.onVim(e),
    });
    // The engine-level gate catches keys that bypass `Session.feed` — `:normal`,
    // macro replay and dot-repeat — so a locked skill cannot leak through them.
    this.vim.gate = (k) => (this.keyAllowed(k) ? null : 'LOCKED');
  }

  private emit(e: SessionEvent): void {
    this.onEvent?.(e);
  }

  private onVim(e: VimEvent): void {
    this.emit({ type: 'vim', event: e });
    if (e.type === 'message' && e.text) this.emit({ type: 'message', text: e.text, level: e.level });
    if (e.type === 'mode') return;
  }

  private afterAction(): void {
    if (this.status !== 'playing') return;
    if (this.checkHazard()) return;
    this.pickUp();
    this.checkWin();
  }

  private pickUp(): void {
    const { line, col } = this.vim.cursor;
    const goals: { type: string; char?: string }[] = [this.stage.goal];
    const chars: string[] = [];
    const walk = (g: unknown): void => {
      const gg = g as { type: string; char?: string; of?: unknown[] };
      if (gg.type === 'collect' && gg.char) chars.push(gg.char);
      if (gg.type === 'all' && gg.of) gg.of.forEach(walk);
    };
    goals.forEach(walk);
    if (!chars.length) return;
    const ch = this.vim.buf.line(line)[col] ?? '';
    if (chars.includes(ch)) {
      const k = line * 10000 + col;
      if (!this.collected.has(k)) this.collected.add(k);
    }
  }

  private checkHazard(): boolean {
    if (!this.hazardChars) return false;
    const ch = this.vim.buf.line(this.vim.cursor.line)[this.vim.cursor.col] ?? '';
    const key = this.vim.cursor.line * 10000 + this.vim.cursor.col;
    if (ch && this.hazardChars.includes(ch) && !this.spent.has(key)) {
      this.spent.add(key);
      this.damage++;
      this.hearts--;
      this.emit({ type: 'damage', hearts: this.hearts, char: ch });
      if (this.hearts <= 0) {
        this.status = 'lost';
        this.emit({ type: 'lost' });
      }
      return true;
    }
    return false;
  }

  checkWin(): boolean {
    if (this.status !== 'playing') return false;
    if (checkGoal(this.stage.goal, this.vim, this.collected)) {
      this.status = 'won';
      this.emit({ type: 'win', stars: this.stars, keys: this.keys, par: this.stage.par });
      return true;
    }
    return false;
  }

  get stars(): Stars {
    if (this.status !== 'won') return 0;
    const { par } = this.stage;
    let s: Stars = this.keys <= par ? 3 : this.keys <= Math.ceil(par * 1.4) ? 2 : 1;
    if (this.damage > 0 && s === 3) s = 2;
    return s;
  }

  /** Returns false when the key was swallowed by the command gate. */
  feed(key: string): boolean {
    if (this.status !== 'playing') return false;
    if (!this.keyAllowed(key)) {
      this.emit({ type: 'locked', key, message: this.lockedMessage(key) });
      return false;
    }
    this.keys++;
    this.emit({ type: 'key', key });
    this.vim.feed(key);
    if (this.vim.mode === 'normal') this.afterAction();
    return true;
  }

  private keyAllowed(key: string): boolean {
    const m = this.vim.mode;
    if (m !== 'normal' && m !== 'visual' && m !== 'visual-line' && m !== 'visual-block') return true;
    if (UNIVERSAL_KEYS.has(key)) return true;
    if (/^[0-9]$/.test(key)) return true;
    // `g` alone does nothing: it is a prefix. The two-key combination is gated
    // at its second letter (below), so a chapter cannot unlock the whole g menu
    // by accident.
    if (key === 'g') return true;

    const p = this.vim.pending;
    // Argument positions (f/t/F/T, r, m, ", q, @, z): the first key was already
    // gated; the argument is free-form, not a skill in its own right.
    if (p && (p.kind === 'find' || p.kind === 'char' || p.kind === 'mark' || p.kind === 'macro-record' || p.kind === 'macro-run' || p.kind === 'reg' || p.kind === 'z')) return true;
    // Two-key g commands: gate the whole "gJ"/"gq"/"gU" name.
    if (p && p.kind === 'g') return this.allowed.has('g' + key);
    // Text objects: gate the combined "iw"/"a(" name so an object from a later
    // chapter cannot be reached through an already-unlocked operator. This must
    // run before the bare `"` check below, because `"` here is an object
    // delimiter, not the register prefix.
    if (p && p.kind === 'textobj') {
      const combo = (p.around ? 'a' : 'i') + key;
      return this.allowed.has(combo) || this.allowed.has(key);
    }
    if (key === '"') return this.allowed.has('"');
    // Operator-pending and every other normal/visual key: it must be unlocked.
    return this.allowed.has(key);
  }

  private lockedMessage(key: string): string {
    const ch = this.chapterForKey(key);
    return ch ? `LOCKED:${ch}` : 'LOCKED';
  }

  /** Overridden by the game layer to name the unlocking chapter. */
  chapterForKey: (key: string) => number | null = () => null;

  restart(): Session {
    const s = new Session({ stage: this.stage, chapterIndex: this.chapterIndex, allowed: this.allowed, onEvent: this.onEvent });
    s.chapterForKey = this.chapterForKey;
    return s;
  }

  get elapsed(): number {
    return performance.now() - this.startedAt;
  }
}
