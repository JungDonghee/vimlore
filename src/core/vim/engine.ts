import { Buffer } from './buffer.ts';
import { ESC, CR, BS, TAB, SPACE, CTRL_W, CTRL_U, tokenize } from './keys.ts';
import * as M from './motions.ts';
import { textObject } from './objects.ts';
import { tokenAt, tokens } from './wordindex.ts';
import { allMatches, compilePattern, pickMatch, type Match } from './search.ts';
import { executeEx } from './ex.ts';
import { flatRange as flatRangeOf, normalizeOperatorRange } from './normalize.ts';
import { caseOperatorCursor, zeroRangeCaseAction } from './cursor.ts';
import type { BufferSnapshot, Mode, MotionResult, Pos, Register } from './types.ts';
import { parseSubstituteArgs } from './ex.ts';

const redge = (re: RegExp, line: string): number => (re.test(line) ? 1 : 0);
void parseSubstituteArgs;

export type VimEvent =
  | { type: 'change'; before: string; after: string; cursor: Pos; kind: string }
  | { type: 'yank'; register: string; text: string }
  | { type: 'mode'; mode: Mode }
  | { type: 'message'; text: string; level: 'info' | 'error' | 'good' }
  | { type: 'bell' }
  | { type: 'search'; pattern: string | null }
  | { type: 'ex'; command: string }
  | { type: 'locked'; key: string; message: string };

type Pending =
  | { kind: 'find'; dir: 1 | -1; till: boolean }
  | { kind: 'char'; replace: boolean }
  | { kind: 'mark'; set: boolean; jump: 'exact' | 'line' }
  | { kind: 'g'; op: boolean }
  | { kind: 'z' }
  | { kind: 'macro-record' }
  | { kind: 'macro-run' }
  | { kind: 'textobj'; around: boolean }
  | { kind: 'reg' };

interface Op {
  key: string;
  count: number;
  motionCount: number;
  reg: string | null;
  /** dd/yy/cc/>>/guu/... (doubled operator) instead of a motion. */
  doubled?: boolean;
}

export interface SelRange {
  start: Pos;
  end: Pos;
  linewise: boolean;
  block?: { c1: number; c2: number; acol?: number };
}

export interface VimOptions {
  text?: string;
  cursor?: Pos;
  textwidth?: number;
  tabstop?: number;
  shiftwidth?: number;
  /** Throw after any feed that leaves the editor in an impossible state. */
  strict?: boolean;
  onEvent?: (e: VimEvent) => void;
}

const WORD_MOTIONS = new Set(['w', 'W', 'b', 'B', 'e', 'E']);
const LINE_MOTIONS = new Set(['j', 'k', '+', '-', '_', CR, ESC]);

/**
 * A compact but faithful Vim emulator.
 *
 * Design notes for future maintainers:
 * - Every mutation goes through `pushUndo()` once per command (insert sessions
 *   snapshot on entry).
 * - Dot-repeat and macros replay *keys*, exactly like Vim; there is no separate
 *   representation of a change.
 * - Motions return a destination + kind; operators convert that to a range.
 */
interface SubMatch { line: number; col: number; len: number; }

interface SubConfirm {
  before: BufferSnapshot;
  lines: string[];
  matches: SubMatch[];
  index: number;
  replacement: string;
  jsRep: string;
  source: string;
  flags: string;
  applied: number;
}

export class Vim {
  buf: Buffer;
  cursor: Pos;
  mode: Mode = 'normal';
  count = '';
  op: Op | null = null;
  pending: Pending | null = null;
  pendingReg: string | null = null;
  registers = new Map<string, Register>();
  marks = new Map<string, Pos>();
  lastFind: { char: string; dir: 1 | -1; till: boolean } | null = null;
  lastSearch = '';
  searchDir: 1 | -1 = 1;
  undoStack: BufferSnapshot[] = [];
  redoStack: BufferSnapshot[] = [];
  visualAnchor: Pos | null = null;
  private visualMotionKey = '';
  insertStart: Pos | null = null;
  lastInsertPos: Pos | null = null;
  message = '';
  messageLevel: 'info' | 'error' | 'good' = 'info';
  cmdline = '';
  cmdKind: ':' | '/' | '?' | null = null;
  cmdBackup: Pos | null = null;
  history: string[] = [];
  lastMacro: string | null = null;
  recording: { reg: string; keys: string[] } | null = null;
  lastChangeKeys: string[] | null = null;
  cmdKeys: string[] = [];
  replaying = false;
  showSearch = true;
  textwidth: number;
  tabstop: number;
  shiftwidth: number;
  number = true;
  relativenumber = false;
  onEvent?: (e: VimEvent) => void;
  gate?: (key: string) => string | null;
  strict = false;
  jumps: Pos[] = [];
  jumpIndex = -1;
  lastSubstitute: { pat: string; rep: string; flags: string } | null = null;
  private subConfirm: SubConfirm | null = null;
  readonly bufferStart: Buffer;
  /** Set by the game layer when a level needs a specific notion of "word". */
  version = 0;

  constructor(opts: VimOptions = {}) {
    this.buf = new Buffer(opts.text ?? '');
    this.cursor = opts.cursor ?? { line: 0, col: 0 };
    this.wantColValue = this.cursor.col;
    this.textwidth = opts.textwidth ?? 72;
    this.tabstop = opts.tabstop ?? 4;
    this.shiftwidth = opts.shiftwidth ?? 2;
    this.onEvent = opts.onEvent;
    this.strict = opts.strict ?? false;
    this.bufferStart = this.buf.clone();
    this.clampCursor();
  }

  // ---------------------------------------------------------------- plumbing

  private emit(e: VimEvent): void {
    this.onEvent?.(e);
  }

  private say(text: string, level: 'info' | 'error' | 'good' = 'info'): void {
    this.message = text;
    this.messageLevel = level;
    this.emit({ type: 'message', text, level });
  }

  private bell(): void {
    this.emit({ type: 'bell' });
  }

  private setMode(mode: Mode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.emit({ type: 'mode', mode });
  }

  private snapshot(): BufferSnapshot {
    return { lines: this.buf.lines.slice(), cursor: { ...this.cursor } };
  }

  pushUndo(): BufferSnapshot {
    return this.snapshot();
  }

  private commit(before: BufferSnapshot, kind: string): void {
    const after = this.buf.flat;
    const beforeFlat = before.lines.join('\n');
    if (after === beforeFlat) {
      return;
    }
    this.undoStack.push(before);
    if (this.undoStack.length > 200) this.undoStack.shift();
    this.redoStack = [];
    this.version++;
    this.emit({ type: 'change', before: beforeFlat, after, cursor: { ...this.cursor }, kind });
    if (this.replaying) return;
    if (this.cmdKeys.length) this.lastChangeKeys = this.cmdKeys.slice();
  }

  /** Run a mutation with a single undo block. */
  private mutate(kind: string, fn: () => void): void {
    const before = this.snapshot();
    fn();
    this.clampCursor();
    this.commit(before, kind);
  }

  get countNum(): number {
    return this.count === '' ? 0 : parseInt(this.count, 10);
  }

  private takeCount(): number {
    const n = this.countNum;
    this.count = '';
    return n > 0 ? n : 1;
  }

  private resetPending(clearKeys = true): void {
    this.count = '';
    this.op = null;
    this.pending = null;
    this.pendingReg = null;
    if (clearKeys) this.cmdKeys = [];
  }

  /** Exposed for the HUD: the keys of the command currently being composed. */
  get pendingCommand(): string {
    return this.cmdKeys.join('');
  }

  /** Prompt for an interactive `:s///c`, or null. */
  get confirmPrompt(): string | null {
    const c = this.subConfirm;
    if (!c) return null;
    const m = c.matches[c.index];
    if (!m) return null;
    return `replace with ${c.replacement}? (y/n/a/q/l)`;
  }

  get confirming(): boolean {
    return this.subConfirm !== null;
  }

  get awaitingKey(): boolean {
    return this.pending !== null || this.op !== null || this.count !== '' || this.pendingReg !== null;
  }

  // ------------------------------------------------------------------- input

  feed(key: string): void {
    try {
      this.feedKey(key);
    } finally {
      if (this.strict) this.assertInvariants();
    }
  }

  private feedKey(key: string): void {
    if (this.recording && !(this.mode === 'normal' && key === 'q' && this.pending === null)) {
      this.recording.keys.push(key);
    }
    if (!this.replaying) this.cmdKeys.push(key);

    // `:s///c` owns the keyboard until y/n/a/q/l/Esc.
    if (this.subConfirm) {
      this.confirmKey(key);
      return;
    }

    // Gate every key in normal/visual modes so a not-yet-unlocked skill cannot
    // be reached through `:normal`, macros or dot-repeat either. Insert, replace
    // and command-line modes are never gated (they are free-form text entry).
    const gateMode = this.mode === 'normal' || this.mode === 'visual' || this.mode === 'visual-line' || this.mode === 'visual-block';
    if (gateMode && this.gate) {
      const deny = this.gate(key);
      if (deny) {
        this.emit({ type: 'locked', key, message: deny });
        this.resetPending();
        return;
      }
    }

    if (this.mode === 'insert' || this.mode === 'replace') {
      this.insertKey(key);
      return;
    }
    if (this.mode === 'cmdline' || this.mode === 'search') {
      this.cmdlineKey(key);
      return;
    }
    if (this.mode === 'visual' || this.mode === 'visual-line' || this.mode === 'visual-block') {
      this.visualKey(key);
      return;
    }
    this.normalKey(key);
    if (this.insertOneShot && this.mode === 'normal' && !this.awaitingKey) {
      this.insertOneShot = false;
      this.setMode('insert');
    }
  }

  feedString(keys: string): void {
    for (const k of tokenize(keys)) this.feed(k);
  }

  /** Structural checks that must hold after every key. Cheap; strict mode only. */
  checkInvariants(): string[] {
    const errors: string[] = [];
    const modes = ['normal', 'insert', 'replace', 'visual', 'visual-line', 'visual-block', 'cmdline', 'search'];
    if (!modes.includes(this.mode)) errors.push(`bad mode ${String(this.mode)}`);
    if (!this.buf || !Array.isArray(this.buf.lines) || this.buf.lines.length === 0) {
      errors.push('empty buffer list');
      return errors;
    }
    for (let i = 0; i < this.buf.lines.length; i++) {
      if (typeof this.buf.lines[i] !== 'string') {
        errors.push(`line ${i} is not a string`);
        break;
      }
    }
    const line = this.buf.line(this.cursor.line);
    if (this.cursor.line < 0 || this.cursor.line >= this.buf.lineCount) errors.push(`cursor line ${this.cursor.line}/${this.buf.lineCount}`);
    if (this.cursor.col < 0 || this.cursor.col > line.length) errors.push(`cursor col ${this.cursor.col}/${line.length} on line ${this.cursor.line}`);
    if (this.visualAnchor) {
      if (this.visualAnchor.line < 0 || this.visualAnchor.line >= this.buf.lineCount) errors.push('visual anchor line out of range');
      const al = this.buf.line(this.visualAnchor.line);
      if (this.visualAnchor.col < 0 || this.visualAnchor.col > al.length) errors.push('visual anchor col out of range');
    }
    if (this.count !== '' && !/^[0-9]+$/.test(this.count)) errors.push(`bad count ${this.count}`);
    if (this.subConfirm) {
      const c = this.subConfirm;
      if (c.index < 0 || c.index > c.matches.length) errors.push(`confirm index ${c.index}/${c.matches.length}`);
      for (const m of c.matches) {
        if (m.line < 0 || m.line >= c.lines.length || m.col < 0 || m.col + m.len > c.lines[m.line].length) {
          errors.push('confirm match out of range');
          break;
        }
      }
    }
    if (this.jumpIndex < -1 || this.jumpIndex >= this.jumps.length) errors.push(`jump index ${this.jumpIndex}/${this.jumps.length}`);
    return errors;
  }

  assertInvariants(): void {
    const errors = this.checkInvariants();
    if (errors.length) throw new Error(`Vim invariant violation: ${errors.join('; ')}`);
  }

  // -------------------------------------------------------------- normal mode

  private normalKey(key: string): void {
    if (this.pending) {
      this.resolvePending(key);
      return;
    }
    if (key === ESC) {
      this.resetPending();
      this.say('');
      return;
    }
    if (this.pendingReg !== null) {
      const reg = key;
      this.pendingReg = null;
      if (/^[a-zA-Z0-9"_+*\-./:]$/.test(reg) || reg === '%' || reg === '#') {
        this.pendingRegSet = reg;
      } else {
        this.bell();
      }
      this.afterUnit();
      return;
    }
    if (key === '"') {
      this.pendingReg = '';
      return;
    }
    if (/^[1-9]$/.test(key) || (key === '0' && this.count !== '')) {
      this.count += key;
      return;
    }
    if (this.op) {
      this.opKey(key);
      return;
    }

    switch (key) {
      case 'h':
      case BS:
        this.moveCount(key, (n) => this.moveBy({ line: 0, col: -n }));
        return;
      case 'l':
      case SPACE:
        this.moveCount(key, (n) => this.moveBy({ line: 0, col: n }));
        return;
      case 'j':
      case 'k':
        this.verticalCount(key, key === 'j' ? 1 : -1);
        return;
      case '0':
        this.moveTo({ line: this.cursor.line, col: 0 }, 'char');
        this.afterUnit();
        return;
      case '^':
        this.moveTo({ line: this.cursor.line, col: M.firstNonBlank(this.buf, this.cursor.line) }, 'char');
        this.afterUnit();
        return;
      case '$':
        this.moveCount(key, (n) => {
          const line = Math.min(this.buf.lineCount - 1, this.cursor.line + n - 1);
          this.moveTo({ line, col: M.lineEnd(this.buf, line) }, 'char');
        });
        return;
      case 'w':
      case 'W':
      case 'b':
      case 'B':
      case 'e':
      case 'E':
        this.wordMove(key);
        return;
      case 'G': {
        const line = this.countNum ? Math.min(this.buf.lineCount - 1, this.countNum - 1) : this.buf.lineCount - 1;
        this.jumpTo({ line, col: M.firstNonBlank(this.buf, line) }, true);
        this.takeCount();
        this.afterUnit();
        return;
      }
      case '%':
        this.percentMotion(false);
        return;
      case '{':
      case '}':
        this.paragraphMove(key === '}' ? 1 : -1);
        return;
      case '(':
      case ')':
        this.sentenceMove(key === ')' ? 1 : -1);
        return;
      case '+':
      case CR: {
        const n = this.takeCount();
        const line = Math.min(this.buf.lineCount - 1, this.cursor.line + n);
        this.moveTo({ line, col: M.firstNonBlank(this.buf, line) }, 'char', true);
        this.afterUnit();
        return;
      }
      case '-': {
        const n = this.takeCount();
        const line = Math.max(0, this.cursor.line - n);
        this.moveTo({ line, col: M.firstNonBlank(this.buf, line) }, 'char', true);
        this.afterUnit();
        return;
      }
      case '_': {
        const n = this.takeCount();
        const line = Math.min(this.buf.lineCount - 1, this.cursor.line + n - 1);
        this.moveTo({ line, col: M.firstNonBlank(this.buf, line) }, 'char', true);
        this.afterUnit();
        return;
      }
      case '|': {
        const n = this.takeCount();
        this.moveTo({ line: this.cursor.line, col: Math.max(0, n - 1) }, 'char');
        this.afterUnit();
        return;
      }
      case 'f':
      case 'F':
      case 't':
      case 'T':
        this.pending = { kind: 'find', dir: key === 'f' || key === 't' ? 1 : -1, till: key === 't' || key === 'T' };
        return;
      case ';':
      case ',': {
        if (!this.lastFind) {
          this.bell();
          this.afterUnit();
          return;
        }
        const f = this.lastFind;
        const flip = key === ',' ? -1 : 1;
        this.doFind(f.char, (f.dir * flip) as 1 | -1, f.till, this.countNum || 1);
        return;
      }
      case 'n':
      case 'N':
        this.searchRepeat(key === 'n' ? this.searchDir : (-this.searchDir as 1 | -1));
        return;
      case '*':
      case '#':
        this.starSearch(key === '*');
        return;
      case '/':
      case '?':
        this.startCmdline(key === '/' ? '/' : '?');
        return;
      case ':':
        this.startCmdline(':');
        return;
      case '`':
      case "'":
        this.pending = { kind: 'mark', set: false, jump: key === '`' ? 'exact' : 'line' };
        return;
      case 'm':
        this.pending = { kind: 'mark', set: true, jump: 'exact' };
        return;
      case 'g':
      case 'z':
        this.pending = { kind: key as 'g' | 'z', op: false };
        return;
      case 'q':
        if (this.recording) {
          this.stopRecording();
          this.afterUnit();
        } else {
          this.pending = { kind: 'macro-record' };
        }
        return;
      case '@':
        this.pending = { kind: 'macro-run' };
        return;
      case 'i':
        this.enterInsert('i');
        return;
      case 'a':
        this.enterInsert('a');
        return;
      case 'I':
        this.enterInsert('I');
        return;
      case 'A':
        this.enterInsert('A');
        return;
      case 'o':
        this.enterInsert('o');
        return;
      case 'O':
        this.enterInsert('O');
        return;
      case 's':
        this.enterInsert('s');
        return;
      case 'S':
        this.enterInsert('S');
        return;
      case 'C':
        this.enterInsert('C');
        return;
      case 'D': {
        const l = this.buf.line(this.cursor.line);
        if (l.length === 0) {
          this.bell();
          this.afterUnit();
          return;
        }
        this.deleteRange({ start: this.cursor, end: { line: this.cursor.line, col: l.length - 1 }, linewise: false }, true, this.pendingRegSet, false);
        return;
      }
      case 'Y':
        this.yankRange({ start: { line: this.cursor.line, col: 0 }, end: { line: this.cursor.line, col: 0 }, linewise: true }, true, this.pendingRegSet, false, true);
        return;
      case 'R':
        this.enterReplace();
        return;
      case 'x':
        this.deleteChars(this.countNum || 1, false);
        return;
      case 'X':
        this.deleteChars(this.countNum || 1, true);
        return;
      case 'r':
        this.pending = { kind: 'char', replace: true };
        return;
      case '~':
        this.toggleCase(this.countNum || 1);
        return;
      case 'J':
        this.joinLines(this.countNum || 2, true);
        return;
      case 'p':
      case 'P':
        this.put(this.targetRegister(), key === 'P');
        return;
      case 'u':
        this.undo();
        return;
      case '<C-r>':
        this.redo();
        return;
      case '.':
        this.repeatChange();
        return;
      case '<C-a>':
        this.changeNumber(this.takeCount());
        return;
      case '<C-x>':
        this.changeNumber(-this.takeCount());
        return;
      case 'v':
        this.startVisual('visual');
        return;
      case 'V':
        this.startVisual('visual-line');
        return;
      case '<C-v>':
        this.startVisual('visual-block');
        return;
      case '<C-d>':
        this.scrollHalf(1);
        return;
      case '<C-u>':
        this.scrollHalf(-1);
        return;
      case '<C-f>':
        this.scrollPage(1);
        return;
      case '<C-b>':
        this.scrollPage(-1);
        return;
      case '<C-e>':
        this.moveTo({ line: Math.min(this.buf.lineCount - 1, this.cursor.line + 1), col: this.cursor.col }, 'char');
        return;
      case '<C-y>':
        this.moveTo({ line: Math.max(0, this.cursor.line - 1), col: this.cursor.col }, 'char');
        return;
      case '<C-o>':
        this.jumpBack();
        return;
      case '<C-i>':
        this.jumpForward();
        return;
      case '<Del>':
        this.deleteChars(1, false);
        return;
      case 'd':
      case 'c':
      case 'y':
      case '>':
      case '<':
        this.startOp(key);
        return;
      case '=':
        this.startOp('=');
        return;
      default:
        this.bell();
        this.afterUnit();
    }
  }

  private pendingRegSet: string | null = null;

  private targetRegister(): string {
    const r = this.pendingRegSet;
    this.pendingRegSet = null;
    return r ?? '"';
  }

  private afterUnit(): void {
    if (this.mode === 'insert' || this.mode === 'replace') return;
    if (!this.replaying && this.cmdKeys.length && !this.awaitingKey) this.cmdKeys = [];
  }

  private startOp(key: string): void {
    this.op = { key, count: this.countNum, motionCount: 0, reg: this.pendingRegSet, doubled: false };
    this.pendingRegSet = null;
    this.count = '';
  }

  private opKey(key: string): void {
    const op = this.op!;
    if (key === ESC) {
      this.resetPending();
      return;
    }
    if ((key === op.key && key !== '<') || (key === '<' && op.key === '<') || (op.key.length === 2 && key === op.key[1])) {
      // dd, yy, cc, >>, <<, == and the two-key g operators: guu, gUU, g~~, gqq, gww
      const n = (this.countNum || 1) * (op.count || 1);
      const last = this.buf.lineCount - 1;
      const remaining = this.buf.lineCount - this.cursor.line;
      // Doubled operators clamp a count to EOF, except when only one line is
      // left and the count is > 1: Vim refuses that (`2dd` on the last line).
      if (n > 1 && remaining < 2) {
        this.bell();
        this.resetPending();
        this.afterUnit();
        return;
      }
      const lines = Math.min(n, remaining);
      op.doubled = true;
      this.applyOp(op, { start: { line: this.cursor.line, col: 0 }, end: { line: Math.min(last, this.cursor.line + lines - 1), col: 0 }, linewise: true });
      return;
    }
    if (key === 'i' || key === 'a') {
      this.pending = { kind: 'textobj', around: key === 'a' };
      return;
    }
    if (/^[1-9]$/.test(key) || (key === '0' && this.count !== '')) {
      this.count += key;
      op.motionCount = this.countNum;
      return;
    }
    if (key === 'g') {
      this.pending = { kind: 'g', op: true };
      return;
    }
    if (key === '/' || key === '?') {
      this.pendingOpSearch = op;
      this.startCmdline(key);
      return;
    }
    if (key === 'f' || key === 'F' || key === 't' || key === 'T') {
      this.pending = { kind: 'find', dir: key === 'f' || key === 't' ? 1 : -1, till: key === 't' || key === 'T' };
      return;
    }
    if (key === 'w' || key === 'W') {
      // Famous Vim special case: cw on a word acts like ce.
      const ch = this.buf.line(this.cursor.line)[this.cursor.col] ?? '';
      if (op.key === 'c' && ch !== '' && !/\s/.test(ch)) {
        // `cw`/`cW` changes through the end of the count-th word, counting the
        // word under the cursor as the first. Token indexes are inclusive, so
        // this also does the right thing on punctuation (`cw` on a comma
        // changes just the comma) instead of overrunning into the next word.
        const big = key === 'W';
        const count = (this.countNum || 1) * (op.count || 1);
        const list = tokens(this.buf, big);
        const t = tokenAt(list, this.buf.idx(this.cursor));
        if (t) {
          let target = t;
          for (let n = 1; n < count; n++) {
            const next = list.find((x) => x.start > target.start && !x.blank);
            if (!next) break;
            target = next;
          }
          this.finishOpWithMotion(op, { to: this.buf.pos(target.end), kind: 'inclusive' });
          return;
        }
      }
    }
    const motionCount = (this.countNum || 1) * (op.count || 1);
    const motion = this.motionFor(key, motionCount, this.countNum > 0 || op.count > 0);
    if (!motion) {
      // `{` at BOF is a zero-length motion: case operators touch the character
      // under the cursor, `>`/`<` shift the current line, `c` inserts without
      // deleting, and d/y are no-ops.
      const failedCount = (this.countNum || 1) * (op.count || 1);
      if (failedCount === 1 && key === '{' && this.cursor.line === 0 && this.cursor.col === 0) {
        if (op.key === 'gU' || op.key === 'gu' || op.key === 'g~') {
          this.finishOpWithMotion(op, { to: { ...this.cursor }, kind: 'exclusive' });
          return;
        }
        if (op.key === '>' || op.key === '<') {
          this.applyOp(op, {
            start: { line: 0, col: 0 },
            end: { line: 0, col: 0 },
            linewise: true,
          });
          return;
        }
        if (op.key === 'c') {
          this.openInsertAt(this.cursor);
          return;
        }
      }
      this.bell();
      this.resetPending();
      return;
    }
    this.finishOpWithMotion(op, motion, key, motionCount);
  }

  private finishOpWithMotion(op: Op, motion: MotionResult, motionKey = '', count = 1): void {
    const from = { ...this.cursor };
    const to = motion.to;
    // Q04: a zero-range 0/^/h at column 0 of a non-first line is linewise
    // for case operators; line 1 toggles one character; ^ at the first
    // non-blank is a no-op. The policy lives in cursor.ts.
    const zero = zeroRangeCaseAction(op.key, motionKey, from, to);
    if (zero === 'linewise') {
      this.applyOp(op, {
        start: { line: from.line, col: 0 },
        end: { line: from.line, col: Math.max(0, this.buf.line(from.line).length - 1) },
        linewise: true,
      });
      return;
    }
    if (zero === 'noop') {
      this.resetPending(false);
      this.afterUnit();
      return;
    }
    // A sentence motion that ends at column 0 of a later line behaves
    // linewise for operators (`d)` deletes the remaining lines, not a blank).
    if (op.key === 'd' && motionKey === ')' && !motion.kind.startsWith('line') && from.col === 0 && to.col === 0 && to.line > from.line) {
      this.applyOp(op, {
        start: { line: from.line, col: 0 },
        end: { line: to.line === this.buf.lineCount - 1 ? to.line : Math.max(from.line, to.line - 1), col: 0 },
        linewise: true,
      });
      return;
    }
    // `2dw`/`2dW` across a blank separator consumes the blank line with the
    // word (Vim leaves the target line at the top); without a blank line the
    // delete stays charwise and only empties the first line.
    if (
      op.key === 'd' &&
      (motionKey === 'w' || motionKey === 'W') &&
      count > 1 &&
      from.col === 0 &&
      to.col === 0 &&
      to.line > from.line + 1
    ) {
      let blank = false;
      for (let l = from.line + 1; l < to.line; l++) if (this.buf.line(l).trim() === '') blank = true;
      if (blank) {
        this.applyOp(op, {
          start: { line: from.line, col: 0 },
          end: { line: to.line - 1, col: 0 },
          linewise: true,
        });
        return;
      }
    }
    // Backward b/B from column 0 stays inside the previous line: when the
    // target is that line's first non-blank the operator is linewise on it;
    // otherwise it is charwise from the target through the line above the
    // cursor. Neither form ever joins the cursor line.
    if (
      (op.key === 'd' || op.key === 'c') &&
      (motionKey === 'b' || motionKey === 'B') &&
      from.col === 0 &&
      to.line < from.line
    ) {
      const fnb = M.firstNonBlank(this.buf, to.line);
      if (to.col === fnb) {
        // The word start is the line's first non-blank: the operator covers
        // the lines from the target through the line above the cursor.
        this.applyOp(op, {
          start: { line: to.line, col: 0 },
          end: { line: Math.max(to.line, from.line - 1), col: 0 },
          linewise: true,
        });
        if (op.key === 'd') {
          this.cursor = { line: to.line, col: 0 };
          this.wantColValue = 0;
        }
        return;
      }
      const endLine = from.line - 1;
      this.rangeInclusive = true;
      this.applyOp(op, {
        start: to,
        end: { line: endLine, col: Math.max(0, this.buf.line(endLine).length - 1) },
        linewise: false,
      });
      if (op.key === 'd') {
        this.cursor = { line: to.line, col: Math.max(0, to.col - 1) };
        this.wantColValue = this.cursor.col;
      }
      return;
    }
    // A failed motion cancels the operator (`dj` on the last line, `cj` at
    // BOF): Vim beeps and leaves the buffer untouched.
    if (motion.failed) {
      this.bell();
      this.resetPending(false);
      this.afterUnit();
      return;
    }
    let range: SelRange;
    if (motion.kind === 'linewise') {
      const lr = motion.lineRange ?? [Math.min(from.line, to.line), Math.max(from.line, to.line)];
      range = {
        start: { line: Math.min(lr[0], lr[1]), col: 0 },
        end: { line: Math.max(lr[0], lr[1]), col: 0 },
        linewise: true,
      };
    } else {
      range = { start: from, end: to, linewise: false };
      this.rangeInclusive = motion.kind === 'inclusive';
    }
    this.yankMotionKey = motionKey;
    this.opMotionFrom = from;
    this.opMotionTo = to;
    this.applyOp(op, range);
    if ((op.key === 'g~' || op.key === 'gu' || op.key === 'gU') && motionKey === 'G' && range.linewise && to.line < from.line) {
      const l1 = Math.min(range.start.line, range.end.line);
      this.cursor = { line: l1, col: M.firstNonBlank(this.buf, l1) };
      this.wantColValue = this.cursor.col;
    }
    if ((op.key === 'g~' || op.key === 'gu' || op.key === 'gU') && motionKey === '%' && range.linewise) {
      const l1 = Math.min(range.start.line, range.end.line);
      this.cursor = { line: l1, col: from.col === 0 ? 0 : M.firstNonBlank(this.buf, l1) };
      this.wantColValue = this.cursor.col;
    }
    if (motion.jump) this.pushJump(from);
  }

  rangeInclusive = false;
  /** Motion endpoints of the operator that is currently being applied. */
  private opMotionFrom: Pos | null = null;
  private opMotionTo: Pos | null = null;

  /** Convert a (start,end) pair plus inclusivity into flat [s,e). */
  private flatRange(r: SelRange, inclusive: boolean): [number, number] {
    return flatRangeOf(this.buf, r, inclusive);
  }

  private applyOp(op: Op, r: SelRange): void {
    const fromTextObject = this.fromTextObject;
    const yankMotionKey = this.yankMotionKey;
    const motionFrom = this.opMotionFrom;
    const motionTo = this.opMotionTo;
    this.fromTextObject = false;
    this.yankMotionKey = '';
    this.opMotionFrom = null;
    this.opMotionTo = null;
    const inclusive = this.rangeInclusive;
    // All operator range quirks live in normalize.ts (Q02/Q10 ...). The engine
    // keeps only the effect dispatch.
    const range: SelRange = normalizeOperatorRange(this.buf, op.key, r, inclusive, this.mode.startsWith('visual'));
    if (op.key === 'd') this.deleteRange(range, inclusive, op.reg, false);
    else if (op.key === 'c') this.deleteRange(range, inclusive, op.reg, true);
    else if (op.key === 'y') this.yankRange(r, inclusive, op.reg, false, op.doubled, yankMotionKey, fromTextObject, motionTo);
    else if (op.key === '>') this.shiftRange(r, 1);
    else if (op.key === '<') this.shiftRange(r, -1);
    else if (op.key === '=') this.indentRange(r);
    else if (op.key === 'g~') this.caseRange(r, inclusive, 'toggle', false, op.doubled, fromTextObject, motionFrom, motionTo);
    else if (op.key === 'gu') this.caseRange(r, inclusive, 'lower', false, op.doubled, fromTextObject, motionFrom, motionTo);
    else if (op.key === 'gU') this.caseRange(r, inclusive, 'upper', false, op.doubled, fromTextObject, motionFrom, motionTo);
    else if (op.key === 'gq' || op.key === 'gw') this.formatRange(r);
    this.resetPending(false);
    this.afterUnit();
  }

  private startVisual(mode: 'visual' | 'visual-line' | 'visual-block'): void {
    this.visualAnchor = { ...this.cursor };
    this.setMode(mode);
    this.cmdKeys = [];
  }

  // ------------------------------------------------------------------ motions

  private motionEnv(): M.MotionEnv {
    return {
      buf: this.buf,
      cursor: this.cursor,
      wantCol: this.wantCol(),
      lastFind: this.lastFind,
      marks: this.marks,
      getMark: (n) => this.marks.get(n) ?? null,
      searchNext: () => null,
      searchWord: () => null,
      textwidth: this.textwidth,
    };
  }

  wantColValue = 0;

  private wantCol(): number {
    return this.wantColValue;
  }

  private moveTo(p: Pos, kind: 'char' | 'line' = 'char', jump = false): void {
    const prev = { ...this.cursor };
    this.cursor = M.moveTo(this.buf, p);
    if (kind === 'char') this.wantColValue = this.cursor.col;
    if (jump) this.pushJump(prev);
  }

  private forward: Pos[] = [];

  private pushJump(from: Pos): void {
    this.jumps.push({ ...from });
    if (this.jumps.length > 60) this.jumps.shift();
    this.forward = [];
  }

  private jumpTo(p: Pos, push: boolean): void {
    const from = { ...this.cursor };
    this.moveTo(p, 'char');
    if (push) this.pushJump(from);
  }

  private moveBy(delta: Pos): void {
    this.moveTo({ line: this.cursor.line + delta.line, col: this.cursor.col + delta.col }, 'char');
  }

  private moveCount(key: string, fn: (n: number) => void): void {
    const n = this.takeCount();
    fn(n);
    void key;
    this.afterUnit();
  }

  private verticalCount(key: string, dir: 1 | -1): void {
    const n = this.takeCount();
    const target = Math.max(0, Math.min(this.buf.lineCount - 1, this.cursor.line + dir * n));
    const len = this.buf.line(target).length;
    const col = Math.max(0, Math.min(this.wantColValue, Math.max(0, len - 1)));
    this.cursor = { line: target, col };
    void key;
    this.afterUnit();
  }

  private wordMove(key: string): void {
    const n = this.takeCount();
    const big = key === 'W' || key === 'B' || key === 'E';
    const dir = key === 'b' || key === 'B' ? -1 : 1;
    const end = key === 'e' || key === 'E';
    const res = M.wordMotion(this.motionEnv(), n, { big, dir, end });
    if (res) this.moveTo(res.to, 'char');
    this.afterUnit();
  }

  private paragraphMove(dir: 1 | -1): void {
    const n = this.takeCount();
    const res = M.paragraphMotion(this.motionEnv(), dir, n);
    if (!res) {
      this.bell();
      this.afterUnit();
      return;
    }
    this.moveTo(res.to, 'char', true);
    this.afterUnit();
  }

  private sentenceMove(dir: 1 | -1): void {
    const n = this.takeCount();
    const res = M.sentenceMotion(this.motionEnv(), dir, n);
    if (!res) {
      // A counted motion that runs out of sentences fails and keeps the cursor.
      this.bell();
      this.afterUnit();
      return;
    }
    this.moveTo(res.to, 'char', true);
    if (res.failed) this.bell();
    this.afterUnit();
  }

  private percentMotion(force: boolean): void {
    const n = this.countNum;
    const res = M.matchBracket(this.motionEnv());
    if (res) {
      this.moveTo(res.to, 'char', true);
    } else if (n > 0 || force) {
      const pct = n > 0 ? Math.min(100, n) : 50;
      const line = Math.min(this.buf.lineCount - 1, Math.floor(((this.buf.lineCount - 1) * pct) / 100));
      this.moveTo({ line, col: 0 }, 'char', true);
    } else {
      this.bell();
    }
    this.takeCount();
    this.afterUnit();
  }

  private doFind(char: string, dir: 1 | -1, till: boolean, count: number): void {
    this.lastFind = { char, dir, till };
    const res = M.findChar(this.motionEnv(), char, dir, till, count);
    if (!res) {
      this.bell();
    } else {
      this.moveTo(res.to, 'char');
    }
    this.afterUnit();
  }

  private scrollHalf(dir: 1 | -1): void {
    const n = this.takeCount();
    const target = Math.max(0, Math.min(this.buf.lineCount - 1, this.cursor.line + dir * 5 * n));
    this.moveTo({ line: target, col: this.cursor.col }, 'char');
    this.afterUnit();
  }

  private scrollPage(dir: 1 | -1): void {
    const n = this.takeCount();
    const target = Math.max(0, Math.min(this.buf.lineCount - 1, this.cursor.line + dir * 15 * n));
    this.moveTo({ line: target, col: this.cursor.col }, 'char', true);
    this.afterUnit();
  }

  private jumpBack(): void {
    const to = this.jumps.pop();
    if (to) {
      this.forward.push({ ...this.cursor });
      this.cursor = M.moveTo(this.buf, to);
      this.wantColValue = this.cursor.col;
    } else this.bell();
    this.afterUnit();
  }

  private jumpForward(): void {
    const to = this.forward.pop();
    if (to) {
      this.jumps.push({ ...this.cursor });
      this.cursor = M.moveTo(this.buf, to);
      this.wantColValue = this.cursor.col;
    } else this.bell();
    this.afterUnit();
  }

  /** Resolve a key to a motion for operator-pending mode. */
  private motionFor(key: string, count: number, explicitCount = count > 1): MotionResult | null {
    const env = this.motionEnv();
    switch (key) {
      case 'h':
      case BS:
        return { to: { line: this.cursor.line, col: Math.max(0, this.cursor.col - count) }, kind: 'exclusive' };
      case 'l':
      case SPACE:
        return { to: { line: this.cursor.line, col: this.cursor.col + count }, kind: 'exclusive' };
      case 'j':
        return M.vertical(env, count);
      case 'k':
        return M.vertical(env, -count);
      case '0':
        return { to: { line: this.cursor.line, col: 0 }, kind: 'exclusive' };
      case '^':
        return { to: { line: this.cursor.line, col: M.firstNonBlank(this.buf, this.cursor.line) }, kind: 'exclusive' };
      case '$': {
        const last = this.buf.lineCount - 1;
        // A counted `$` clamps to the last line when there is somewhere to go,
        // but fails when the cursor is already there (`2d$` on the last line).
        if (count > 1 && this.cursor.line === last) {
          return { to: { ...this.cursor }, kind: 'inclusive', failed: true };
        }
        const line = Math.min(last, this.cursor.line + count - 1);
        // `$` is always a charwise motion; a counted `$` that crosses lines
        // becomes linewise only through the delete conversion below.
        // On an empty line `$` has zero width, so `d$` must not eat the newline.
        const empty = this.buf.line(line).length === 0;
        if (empty && count > 1) {
          return { to: { line, col: 0 }, kind: 'linewise', lineRange: [this.cursor.line, line] };
        }
        return { to: { line, col: M.lineEnd(this.buf, line) }, kind: empty ? 'exclusive' : 'inclusive' };
      }
      case '+':
      case CR: {
        const line = Math.min(this.buf.lineCount - 1, this.cursor.line + count);
        if (line === this.cursor.line) return null;
        return { to: { line, col: M.firstNonBlank(this.buf, line) }, kind: 'linewise', lineRange: [this.cursor.line, line] };
      }
      case '-': {
        const line = Math.max(0, this.cursor.line - count);
        if (line === this.cursor.line) return null;
        return { to: { line, col: M.firstNonBlank(this.buf, line) }, kind: 'linewise', lineRange: [line, this.cursor.line] };
      }
      case '_': {
        const line = Math.min(this.buf.lineCount - 1, this.cursor.line + count - 1);
        return { to: { line, col: M.firstNonBlank(this.buf, line) }, kind: 'linewise', lineRange: [this.cursor.line, line] };
      }
      case '|':
        return { to: { line: this.cursor.line, col: Math.max(0, Math.min(count - 1, M.lineEnd(this.buf, this.cursor.line))) }, kind: 'exclusive' };
      case 'w':
        return M.wordMotion(env, count, { dir: 1 });
      case 'W':
        return M.wordMotion(env, count, { dir: 1, big: true });
      case 'b':
        return M.wordMotion(env, count, { dir: -1 });
      case 'B':
        return M.wordMotion(env, count, { dir: -1, big: true });
      case 'e':
        return M.wordMotion(env, count, { dir: 1, end: true });
      case 'E':
        return M.wordMotion(env, count, { dir: 1, end: true, big: true });
      case 'G': {
        // Without a typed count `G` goes to the last line; `2G`/`dG` count means line N.
        const target = explicitCount ? Math.min(count - 1, this.buf.lineCount - 1) : this.buf.lineCount - 1;
        return { to: { line: target, col: 0 }, kind: 'linewise', jump: true };
      }
      case '}':
        return M.paragraphMotion(env, 1, count);
      case '{':
        return M.paragraphMotion(env, -1, count);
      case ')':
        return M.sentenceMotion(env, 1, count);
      case '(':
        return M.sentenceMotion(env, -1, count);
      case '%': {
        if (explicitCount) {
          // `[count]%` is a percentage motion, not a bracket match: it lands
          // linewise on the ceil(count% of the file) line.
          const last = this.buf.lineCount - 1;
          const line = Math.min(last, Math.max(0, Math.ceil((count * this.buf.lineCount) / 100) - 1));
          return { to: { line, col: 0 }, kind: 'linewise', lineRange: [this.cursor.line, line] };
        }
        return M.matchBracket(env);
      }
      case ',':
      case ';': {
        if (!this.lastFind) return null;
        const f = this.lastFind;
        const flip = key === ',' ? -1 : 1;
        return M.findChar(env, f.char, (f.dir * flip) as 1 | -1, f.till, count);
      }
      case 'n':
      case 'N': {
        const pos = this.findSearchMatch(count, key === 'n' ? this.searchDir : (-this.searchDir as 1 | -1));
        return pos ? { to: pos, kind: 'exclusive', jump: true } : null;
      }
      default:
        return null;
    }
  }

  // ----------------------------------------------------------------- editing

  /**
   * Ctrl-a / Ctrl-x. Vim's default `nrformats` is `octal,hex`, so 007 + 1 is
   * 010 and 0x1f + 1 is 0x20 — matched here and covered by the vim oracle.
   */
  private changeNumber(delta: number): void {
    const line = this.buf.line(this.cursor.line);
    const m = /(0[xX][0-9a-fA-F]+|0[0-7]+|\d+)/.exec(line.slice(this.cursor.col));
    if (!m) {
      this.bell();
      this.afterUnit();
      return;
    }
    const raw = m[0];
    const start = this.cursor.col + m.index;
    const isHex = /^0[xX]/.test(raw);
    const isOctal = !isHex && raw.length > 1 && raw[0] === '0';
    const base = isHex ? 16 : isOctal ? 8 : 10;
    const value = parseInt(isHex ? raw.slice(2) : raw, base) + delta;
    const next = isHex ? `0x${value.toString(16)}` : isOctal ? `0${value.toString(8)}` : String(value);
    const before = this.snapshot();
    this.buf.setLine(this.cursor.line, line.slice(0, start) + next + line.slice(start + raw.length));
    this.cursor = M.moveTo(this.buf, { line: this.cursor.line, col: start + Math.max(0, next.length - 1) });
    this.wantColValue = this.cursor.col;
    this.commit(before, 'change');
    this.afterUnit();
  }

  private deleteChars(n: number, backward: boolean): void {
    this.takeCount();
    const line = this.buf.line(this.cursor.line);
    const s = backward ? Math.max(0, this.cursor.col - n) : this.cursor.col;
    const e = backward ? this.cursor.col : Math.min(line.length, this.cursor.col + n);
    if (e <= s) {
      this.bell();
      this.afterUnit();
      return;
    }
    const before = this.snapshot();
    const text = line.slice(s, e);
    this.buf.setLine(this.cursor.line, line.slice(0, s) + line.slice(e));
    this.cursor = M.moveTo(this.buf, { line: this.cursor.line, col: s });
    this.wantColValue = this.cursor.col;
    this.storeRegister(this.pendingRegSet, text, false, false, true);
    this.pendingRegSet = null;
    this.commit(before, 'delete');
    this.afterUnit();
  }

  private normalizeRegisterName(name: string): string {
    if (/^[A-Z]$/.test(name)) return name.toLowerCase();
    return name;
  }

  private storeRegister(name: string | null, text: string, linewise: boolean, yank: boolean, small = false, blockwise = false): void {
    const append = !!name && /^[A-Z]$/.test(name);
    const n = name ? this.normalizeRegisterName(name) : null;
    if (n === '_') return;
    const entry: Register = { text, linewise, blockwise };
    if (n && n !== '"') {
      if (append) {
        const prev = this.registers.get(n);
        if (prev) entry.text = prev.text + text;
      }
      this.registers.set(n, entry);
    }
    if (yank) {
      this.registers.set('0', entry);
    } else if (!small) {
      for (let i = 9; i >= 2; i--) {
        const prev = this.registers.get(String(i - 1));
        if (prev) this.registers.set(String(i), prev);
      }
      this.registers.set('1', entry);
    } else {
      this.registers.set('-', entry);
    }
    this.registers.set('"', entry);
    if (n === '+') this.registers.set('+', entry);
  }

  private readRegister(name: string): Register {
    if (name === '"') return this.registers.get('"') ?? { text: '', linewise: false };
    if (name === '%') return { text: this.buf.flat, linewise: false };
    if (name === '#') return { text: '', linewise: false };
    if (name === ':') return { text: this.history[this.history.length - 1] ?? '', linewise: false };
    return this.registers.get(this.normalizeRegisterName(name)) ?? this.registers.get('"') ?? { text: '', linewise: false };
  }

  deleteRange(r: SelRange, inclusive: boolean, reg: string | null, change: boolean): void {
    const before = this.snapshot();
    if (r.block) {
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      const c1 = r.block.c1;
      const c2 = r.block.c2;
      const removed: string[] = [];
      for (let l = l1; l <= l2; l++) {
        const line = this.buf.line(l);
        const from = Math.min(c1, line.length);
        const to = Math.min(c2 + 1, line.length);
        removed.push(to > from ? line.slice(from, to) : '');
        this.buf.setLine(l, line.slice(0, from) + line.slice(to));
      }
      this.buf.setLines(this.buf.lines);
      this.storeRegister(reg, removed.join('\n'), false, false, false, true);
      if (change) {
        // Block change inserts at the block's left edge, which may be one past
        // the shortened line; do not clamp to the last character. Typed text
        // is replicated on every block line when insert mode closes.
        this.openInsertAt({ line: l1, col: Math.min(c1, this.buf.line(l1).length) }, before);
        if (l2 > l1) this.blockInsertState = { snap: before, l1, l2, col: c1, curLine: l1, text: '' };
        return;
      }
      this.cursor = M.moveTo(this.buf, { line: l1, col: c1 });
      this.wantColValue = this.cursor.col;
      this.commit(before, 'delete');
      this.afterUnit();
      return;
    }
    if (r.linewise) {
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      const count = l2 - l1 + 1;
      const undoCol = this.cursor.col;
      const removed = this.buf.lines.splice(l1, count, ...(change ? [''] : []));
      const becameEmpty = this.buf.lines.length === 0;
      if (becameEmpty) this.buf.setLines(['']);
      // Vim undo lands on the last removed line at the command's column; if
      // the buffer became empty it lands on the first removed line instead.
      before.undoCursor = becameEmpty ? { line: l1, col: 0 } : { line: l2, col: undoCol };
      this.buf.setLines(this.buf.lines);
      this.storeRegister(reg, removed.join('\n') + '\n', true, false);
      const target = Math.min(l1, this.buf.lineCount - 1);
      if (change) {
        this.openInsertAt({ line: l1, col: 0 }, before);
        return;
      }
      this.cursor = { line: target, col: M.firstNonBlank(this.buf, target) };
      this.wantColValue = this.cursor.col;
    } else {
      const [s, e] = this.flatRange(r, inclusive);
      if (e > s) {
        const text = this.buf.flat.slice(s, e);
        this.buf.replaceFlat(s, e, '');
        this.storeRegister(reg, text, false, false, text.length < 40 && !text.includes('\n'));
        const p = this.buf.pos(Math.min(s, this.buf.flat.length));
        if (change) {
          this.openInsertAt(p, before);
          return;
        }
        this.cursor = M.moveTo(this.buf, p);
        this.wantColValue = this.cursor.col;
      } else {
        this.cursor = M.moveTo(this.buf, r.start);
      }
    }
    if (change) {
      this.openInsertAt(this.cursor, before);
    } else {
      this.commit(before, 'delete');
      this.afterUnit();
    }
  }

  yankRange(r: SelRange, inclusive: boolean, reg: string | null, visual = false, keepCol = false, motionKey = '', fromTextObject = false, motionTo?: Pos | null, visualAnchor?: Pos | null): void {
    if (r.block) {
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      const c1 = r.block.c1;
      const c2 = r.block.c2;
      const parts: string[] = [];
      for (let l = l1; l <= l2; l++) {
        const line = this.buf.line(l);
        parts.push(line.slice(Math.min(c1, line.length), Math.min(c2 + 1, line.length)));
      }
      const text = parts.join('\n');
      this.storeRegister(reg, text, false, true, false, true);
      this.cursor = M.moveTo(this.buf, { line: l1, col: c1 });
      this.wantColValue = this.cursor.col;
      this.emit({ type: 'yank', register: reg ?? '"', text });
      this.say(`yanked ${l2 - l1 + 1} line(s)`, 'good');
      this.afterUnit();
      return;
    }
    if (r.linewise) {
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      const text = this.buf.lines.slice(l1, l2 + 1).join('\n') + '\n';
      this.storeRegister(reg, text, true, true);
      // Vim puts the cursor on the first line of a linewise yank. `yy`/`yj`
      // keep the column; visual yanks use the anchor column; everything else
      // (gg/G/%, text objects) lands on column 0 of the first line.
      if (visual) {
        // A jump motion puts the cursor on the first selected line's first
        // non-blank. A bottom-up selection keeps the anchor column; a top-down
        // one puts the cursor at column 0.
        if (
          motionKey === 'gg' ||
          motionKey === 'G' ||
          motionKey === '%' ||
          motionKey === '}' ||
          motionKey === '{' ||
          motionKey === ')' ||
          motionKey === '('
        ) {
          const upward = visualAnchor && visualAnchor.line > l1;
          this.cursor = { line: l1, col: upward ? M.firstNonBlank(this.buf, l1) : 0 };
        } else {
          const upward = visualAnchor && visualAnchor.line > l1;
          this.cursor = M.moveTo(this.buf, { line: l1, col: upward ? visualAnchor!.col : 0 });
        }
      } else if (keepCol || motionKey === 'j' || motionKey === 'k') {
        this.cursor = M.moveTo(this.buf, { line: l1, col: this.cursor.col });
      } else if (fromTextObject) {
        this.cursor = M.moveTo(this.buf, { line: l1, col: r.start.col });
      } else if (motionKey === 'gg' && motionTo) {
        // Uncounted gg lands on the first non-blank of line 1. A counted gg
        // behaves like G: forward keeps the column, backward uses the target's
        // first non-blank, and a no-op move zeroes it.
        if (motionTo.line === 0) {
          this.cursor = { line: l1, col: this.cursor.col === 0 ? 0 : M.firstNonBlank(this.buf, 0) };
        }
        else if (motionTo.line > this.cursor.line) this.cursor = M.moveTo(this.buf, { line: l1, col: this.cursor.col });
        else if (motionTo.line < this.cursor.line) this.cursor = { line: l1, col: M.firstNonBlank(this.buf, l1) };
        else this.cursor = { line: l1, col: 0 };
      } else if (motionKey === 'G' && motionTo) {
        // Forward G keeps the column; a backward counted G lands on the target
        // line's first non-blank; G that does not move zeroes the column.
        if (motionTo.line > this.cursor.line) this.cursor = M.moveTo(this.buf, { line: l1, col: this.cursor.col });
        else if (motionTo.line < this.cursor.line) this.cursor = { line: l1, col: M.firstNonBlank(this.buf, l1) };
        else this.cursor = { line: l1, col: 0 };
      } else if (motionKey === '%') {
        this.cursor = { line: l1, col: this.cursor.col === 0 ? 0 : M.firstNonBlank(this.buf, l1) };
      } else {
        this.cursor = { line: l1, col: 0 };
      }
      this.emit({ type: 'yank', register: reg ?? '"', text });
    } else {
      const [s, e] = this.flatRange(r, inclusive);
      let text = this.buf.flat.slice(s, Math.max(s, e));
      // Vim stores a charwise yank that covers complete lines (both ends at
      // column 0) as a linewise register (`y)`, `2yw`, `yb`). `$` is the
      // exception: it stays charwise.
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      const blankBetween = this.buf.lines.slice(l1, l2 + 1).some((line) => line.trim() === '');
      const targetBlank = this.buf.line(r.end.line).trim() === '';
      const wholeLines =
        !((motionKey === 'w' || motionKey === 'W') && targetBlank) &&
        r.start.col === 0 &&
        r.end.col === 0 &&
        l2 > l1 &&
        !visual &&
        blankBetween &&
        motionKey !== '$' &&
        (!inclusive || (fromTextObject && text.endsWith('\n')));
      if (wholeLines) text = this.buf.lines.slice(l1, l2).join('\n') + '\n';
      this.storeRegister(reg, text, wholeLines, true);
      const p = this.buf.pos(s);
      this.cursor = M.moveTo(this.buf, p);
      this.emit({ type: 'yank', register: reg ?? '"', text });
    }
    this.wantColValue = this.cursor.col;
    this.say(`yanked ${this.describeRange(r, inclusive)}`, 'good');
    this.afterUnit();
  }

  private describeRange(r: SelRange, inclusive: boolean): string {
    const [s, e] = this.flatRange(r, inclusive);
    const n = Math.max(0, e - s);
    if (r.linewise) return `${Math.abs(r.end.line - r.start.line) + 1} line(s)`;
    return `${n} char(s)`;
  }

  private shiftRange(r: SelRange, dir: 1 | -1): void {
    let l1 = Math.min(r.start.line, r.end.line);
    let l2 = Math.max(r.start.line, r.end.line);
    if (!r.linewise && !r.block && !this.mode.startsWith('visual')) {
      // A charwise operator range that ends at column 0 of a later line
      // contributes no characters to that line: Vim shifts only the lines the
      // text touches. Visual selections include the cursor line regardless.
      const [s, e] = this.flatRange(r, this.rangeInclusive);
      if (e > s) {
        const start = this.buf.pos(s);
        const last = this.buf.pos(Math.max(s, e - 1));
        l1 = start.line;
        l2 = last.line;
        // If the part of the range on the last line is only indentation, Vim
        // does not shift that line (`>W` at EOL shifts the current line only).
        if (l2 > l1 && this.buf.line(l2).slice(0, last.col + 1).trim() === '') l2--;
      }
    }
    const before = this.snapshot();
    // Vim's undo lands on the start of the shifted range, not necessarily the
    // operator cursor (e.g. `>h` from col 2 undoes to col 1).
    const undoLine = Math.min(r.start.line, r.end.line);
    const undoCol = r.linewise
      ? Math.max(r.start.line, r.end.line) > undoLine && !this.op?.doubled && !this.mode.startsWith('visual')
        ? this.cursor.col
        : 0
      : r.block
        ? r.block.c1
        : Math.min(r.start.col, r.end.col);
    before.undoCursor = { line: undoLine, col: undoCol };
    const pad = ' '.repeat(this.shiftwidth);
    if (r.block) {
      // Block shift moves the selected columns: `>` inserts at c1, while `<`
      // only outdents lines whose indent the block starts inside. When the
      // anchor is right of column 0 but the block's left edge is 0 and a line
      // is too short to reach c2, Vim shrinks the block to start at column 1.
      let c1 = r.block.c1;
      if (
        dir < 0 &&
        c1 === 0 &&
        (r.block.acol ?? 0) > 0 &&
        l1 !== l2 &&
        (() => {
          for (let l = l1; l <= l2; l++) if (this.buf.line(l).length <= r.block!.c2) return true;
          return false;
        })()
      ) {
        c1 =
          this.visualMotionKey === 'G' ||
          this.visualMotionKey === 'gg' ||
          this.visualMotionKey === '$' ||
          this.visualMotionKey === '}' ||
          this.visualMotionKey === '{'
            ? 0
            : 1;
      }
      for (let l = l1; l <= l2; l++) {
        const line = this.buf.line(l);
        if (line.trim() === '') continue;
        if (dir > 0) {
          const col = Math.min(c1, line.length);
          this.buf.setLine(l, line.slice(0, col) + pad + line.slice(col));
        } else {
          const from = Math.min(c1, line.length);
          let k = 0;
          while (k < this.shiftwidth && (line[from + k] === ' ' || line[from + k] === '\t')) k++;
          if (k === 0) continue;
          this.buf.setLine(l, line.slice(0, from) + line.slice(from + k));
        }
      }
      this.buf.setLines(this.buf.lines);
      this.cursor = M.moveTo(this.buf, { line: l1, col: c1 });
      this.wantColValue = this.cursor.col;
      this.commit(before, dir > 0 ? 'indent' : 'outdent');
      this.say(dir > 0 ? '>>' : '<<', 'good');
      this.afterUnit();
      return;
    }
    for (let l = l1; l <= l2; l++) {
      const line = this.buf.line(l);
      // Vim leaves blank lines blank when shifting.
      if (line.trim() === '') continue;
      if (dir > 0) this.buf.setLine(l, pad + line);
      else {
        let k = 0;
        while (k < this.shiftwidth && (line[k] === ' ' || line[k] === '\t')) k++;
        this.buf.setLine(l, line.slice(k));
      }
    }
    this.cursor = { line: l1, col: M.firstNonBlank(this.buf, l1) };
    this.commit(before, dir > 0 ? 'indent' : 'outdent');
    this.say(dir > 0 ? '>>' : '<<', 'good');
    this.afterUnit();
  }

  private fromTextObject = false;
  private yankMotionKey = '';

  private caseRange(
    r: SelRange,
    inclusive: boolean,
    mode: 'toggle' | 'lower' | 'upper',
    visual = false,
    doubled = false,
    fromTextObject = false,
    motionFrom: Pos | null = null,
    motionTo: Pos | null = null,
  ): void {
    const before = this.snapshot();
    const fn0 = mode === 'upper' ? (c: string) => c.toUpperCase() : mode === 'lower' ? (c: string) => c.toLowerCase() : (c: string) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase());
    if (r.block) {
      // Visual-block case change touches only the selected columns on each line.
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      const c1 = r.block.c1;
      const c2 = r.block.c2;
      for (let l = l1; l <= l2; l++) {
        const line = this.buf.line(l);
        const from = Math.min(c1, line.length);
        const to = Math.min(c2 + 1, line.length);
        if (to <= from) continue;
        this.buf.setLine(l, line.slice(0, from) + line.slice(from, to).replace(/[a-zA-Z]/g, fn0) + line.slice(to));
      }
      this.buf.setLines(this.buf.lines);
      this.cursor = M.moveTo(this.buf, { line: l1, col: c1 });
      this.wantColValue = this.cursor.col;
      this.commit(before, 'case');
      this.afterUnit();
      return;
    }
    let [s, e] = this.flatRange(r, inclusive);
    if (r.linewise) {
      const l1 = Math.min(r.start.line, r.end.line);
      const l2 = Math.max(r.start.line, r.end.line);
      s = this.buf.idx({ line: l1, col: 0 });
      e = this.buf.idx({ line: l2, col: this.buf.line(l2).length });
    }
    if (!r.linewise && e === s && s < this.buf.flat.length) e = s + 1;
    const text = this.buf.flat.slice(s, e);
    this.buf.replaceFlat(s, e, text.replace(/[a-zA-Z]/g, fn0));
    if (r.linewise) {
      this.cursor = caseOperatorCursor({
        buf: this.buf,
        cursor: this.cursor,
        start: r.start,
        end: r.end,
        visual,
        doubled,
        fromTextObject,
        motionFrom,
        motionTo,
      });
    } else {
      this.cursor = M.moveTo(this.buf, this.buf.pos(s));
    }
    if (!visual && !r.block) {
      before.undoCursor = {
        line: Math.min(r.start.line, r.end.line),
        col: this.cursor.col,
      };
    }
    this.commit(before, 'case');
    this.afterUnit();
  }

  /** Simple C-like `=` indent: brace depth * shiftwidth, spaces. */
  private indentRange(r: SelRange): void {
    const l1 = Math.min(r.start.line, r.end.line);
    const l2 = Math.max(r.start.line, r.end.line);
    const braces = (text: string): number => {
      let d = 0;
      for (const c of text) {
        if (c === '{') d++;
        else if (c === '}') d--;
      }
      return d;
    };
    let depth = 0;
    for (let l = 0; l < l1; l++) depth = Math.max(0, depth + braces(this.buf.line(l)));
    const before = this.snapshot();
    const lines = this.buf.lines.slice();
    for (let l = l1; l <= l2; l++) {
      const text = lines[l].trim();
      if (!text) {
        lines[l] = '';
        continue;
      }
      const startsClose = text.startsWith('}');
      const d = Math.max(0, depth - (startsClose ? 1 : 0));
      lines[l] = ' '.repeat(d * this.shiftwidth) + text;
      depth = Math.max(0, d + braces(text));
    }
    this.buf.setLines(lines);
    this.cursor = { line: l1, col: M.firstNonBlank(this.buf, l1) };
    this.wantColValue = this.cursor.col;
    this.commit(before, 'indent');
    this.say('= reindented', 'good');
    this.afterUnit();
  }

  private formatRange(r: SelRange): void {
    const l1 = Math.min(r.start.line, r.end.line);
    const l2 = Math.max(r.start.line, r.end.line);
    const before = this.snapshot();
    const wrapped = M.wrapLines(this.buf.lines.slice(l1, l2 + 1), this.textwidth);
    this.buf.lines.splice(l1, l2 - l1 + 1, ...wrapped);
    this.buf.setLines(this.buf.lines);
    this.cursor = { line: l1, col: 0 };
    this.commit(before, 'format');
    this.afterUnit();
  }

  private toggleCase(n: number): void {
    this.takeCount();
    const before = this.snapshot();
    const line = this.buf.line(this.cursor.line);
    const end = Math.min(line.length, this.cursor.col + n);
    const seg = line.slice(this.cursor.col, end);
    this.buf.setLine(this.cursor.line, line.slice(0, this.cursor.col) + seg.replace(/[a-zA-Z]/g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())) + line.slice(end));
    this.cursor = M.moveTo(this.buf, { line: this.cursor.line, col: Math.min(line.length - 1, this.cursor.col + n) });
    this.commit(before, 'case');
    this.afterUnit();
  }

  private joinLines(count: number, withSpace: boolean): void {
    this.takeCount();
    const n = Math.max(2, count);
    const before = this.snapshot();
    let line = this.cursor.line;
    const startedAt = this.cursor.line;
    let joined = 0;
    for (let i = 1; i < n && line < this.buf.lineCount - 1; i++) {
      joined++;
      const cur = this.buf.line(line);
      const rawNext = this.buf.line(line + 1);
      const next = withSpace ? rawNext.replace(/^[ \t]+/, '') : rawNext;
      const spaces = withSpace ? (cur === '' || cur.endsWith(' ') || next === '' ? 0 : 1) : 0;
      this.buf.setLine(line, cur + ' '.repeat(spaces) + next);
      this.buf.removeLine(line + 1);
      this.cursor = { line, col: Math.min(Math.max(0, cur.length), Math.max(0, this.buf.line(line).length - 1)) };
    }
    if (n >= 3 && joined === 0 && line === startedAt && line === this.buf.lineCount - 1) {
      // `3J` on the last line: Vim moves to column 0 even though nothing joins.
      this.cursor = { line, col: 0 };
    }
    this.commit(before, 'join');
    this.afterUnit();
  }

  private put(regName: string, before: boolean): void {
    const reg = this.readRegister(regName);
    if (reg.text === '') {
      this.takeCount();
      this.pendingRegSet = null;
      this.bell();
      this.afterUnit();
      return;
    }
    const n = this.countNum || 1;
    this.takeCount();
    const snap = this.snapshot();
    if (reg.blockwise) {
      const lines = reg.text.split('\n');
      const baseLine = this.cursor.line;
      const insertCol = before ? this.cursor.col : this.cursor.col + 1;
      for (let i = 0; i < lines.length; i++) {
        const target = baseLine + i;
        while (this.buf.lineCount <= target) this.buf.insertLine(this.buf.lineCount, '');
        const line = this.buf.line(target);
        const col = Math.min(insertCol, line.length);
        this.buf.setLine(target, line.slice(0, col) + lines[i] + line.slice(col));
      }
      this.buf.setLines(this.buf.lines);
      this.cursor = M.moveTo(this.buf, { line: baseLine, col: before ? this.cursor.col : this.cursor.col + 1 });
      this.wantColValue = this.cursor.col;
      this.commit(snap, 'put');
      this.afterUnit();
      return;
    }
    if (reg.linewise) {
      const raw = reg.text.endsWith('\n') ? reg.text.slice(0, -1) : reg.text;
      const lines = raw.split('\n');
      const at = before ? this.cursor.line : this.cursor.line + 1;
      const insert: string[] = [];
      for (let i = 0; i < n; i++) insert.push(...lines);
      this.buf.lines.splice(at, 0, ...insert);
      this.buf.setLines(this.buf.lines);
      this.cursor = { line: at, col: M.firstNonBlank(this.buf, at) };
      this.wantColValue = this.cursor.col;
    } else {
      const text = reg.text.repeat(n);
      const line = this.buf.line(this.cursor.line);
      const col = before ? this.cursor.col : Math.min(line.length, this.cursor.col + 1);
      this.buf.setLine(this.cursor.line, line.slice(0, col) + text + line.slice(col));
      const p = this.buf.pos(this.buf.idx({ line: this.cursor.line, col: col + text.length }) - 1);
      this.cursor = M.moveTo(this.buf, p);
      this.wantColValue = this.cursor.col;
    }
    this.commit(snap, 'put');
    this.afterUnit();
  }

  /** Linear `:earlier N` / `:later N` (no time units / undo tree yet). */
  exTravel(arg: string, dir: 1 | -1): void {
    const n = Math.max(1, parseInt(arg, 10) || 1);
    for (let i = 0; i < n; i++) {
      if (dir < 0) this.undo();
      else this.redo();
    }
    this.echo(`${dir < 0 ? 'earlier' : 'later'} ${n}`, 'info');
  }

  private undo(): void {
    const s = this.undoStack.pop();
    if (!s) {
      this.bell();
      this.say('already at oldest change', 'error');
      return;
    }
    this.redoStack.push(this.snapshot());
    const after = this.buf.lines.slice();
    this.buf.setLines(s.lines);
    // Vim leaves the cursor at the first changed position after `u`, not at
    // the cursor stored before the change (`ch` from col 2 lands on col 1,
    // `Vjd` on the first changed line). Derive it from the diff.
    if (s.undoCursor) this.cursor = M.moveTo(this.buf, s.undoCursor);
    else {
      const restored = this.buf.flat, previous = after.join('\n');
      let diff = 0;
      while (diff < restored.length && diff < previous.length && restored[diff] === previous[diff]) diff++;
      this.cursor = M.moveTo(this.buf, this.buf.pos(diff));
    }
    this.wantColValue = this.cursor.col;
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'undo' });
    this.say('undo', 'info');
    this.takeCount();
    this.afterUnit();
  }

  private redo(): void {
    const s = this.redoStack.pop();
    if (!s) {
      this.bell();
      this.say('already at newest change', 'error');
      return;
    }
    this.undoStack.push(this.snapshot());
    this.buf.setLines(s.lines);
    this.cursor = M.moveTo(this.buf, s.cursor);
    this.wantColValue = this.cursor.col;
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'redo' });
    this.say('redo', 'info');
    this.takeCount();
    this.afterUnit();
  }

  private repeatChange(): void {
    const keys = this.lastChangeKeys;
    const n = this.takeCount();
    if (!keys || keys.length === 0) {
      this.say('nothing to repeat', 'error');
      this.bell();
      return;
    }
    for (let i = 0; i < n; i++) {
      this.replaying = true;
      for (const k of keys) this.feed(k);
      this.replaying = false;
    }
    this.cmdKeys = [];
    this.afterUnit();
  }

  // ------------------------------------------------------------------- insert

  private enterInsert(kind: 'i' | 'a' | 'I' | 'A' | 'o' | 'O' | 's' | 'S' | 'C'): void {
    const line = this.buf.line(this.cursor.line);
    if (kind === 'a') this.cursor = { line: this.cursor.line, col: Math.min(line.length, this.cursor.col + 1) };
    if (kind === 'I') this.cursor = { line: this.cursor.line, col: M.firstNonBlank(this.buf, this.cursor.line) };
    if (kind === 'A') this.cursor = { line: this.cursor.line, col: line.length };
    if (kind === 's') {
      this.deleteRange({ start: this.cursor, end: this.cursor, linewise: false }, true, this.pendingRegSet, true);
      return;
    }
    if (kind === 'S') {
      this.changeWholeLines(this.countNum || 1);
      return;
    }
    if (kind === 'C') {
      const l = this.buf.line(this.cursor.line);
      this.deleteRange({ start: this.cursor, end: { line: this.cursor.line, col: Math.max(0, l.length - 1) }, linewise: false }, true, this.pendingRegSet, true);
      return;
    }
    if (kind === 'o' || kind === 'O') {
      const snap = this.snapshot();
      const at = kind === 'o' ? this.cursor.line + 1 : this.cursor.line;
      this.buf.insertLine(at, '');
      this.cursor = { line: at, col: 0 };
      this.openInsertAt(this.cursor, snap);
      return;
    }
    this.openInsertAt(this.cursor);
  }

  private changeWholeLines(n: number): void {
    const before = this.snapshot();
    const l1 = this.cursor.line;
    const l2 = Math.min(this.buf.lineCount - 1, l1 + n - 1);
    const removed = this.buf.lines.splice(l1, l2 - l1 + 1, '');
    this.storeRegister(this.pendingRegSet, removed.join('\n') + '\n', true, false);
    this.buf.setLines(this.buf.lines);
    this.cursor = { line: l1, col: 0 };
    this.openInsertAt(this.cursor, before);
  }

  private enterReplace(): void {
    this.insertStart = { ...this.cursor };
    this.mode = 'replace';
    this.emit({ type: 'mode', mode: 'replace' });
    this.takeCount();
  }

  openInsertAt(pos: Pos, undoSnapshot?: BufferSnapshot): void {
    // Insert mode ends the operator composition. Several `c` paths open insert
    // without going through applyOp (zero-range/failed motions, empty objects);
    // leaving `op` set would swallow the next key and break undo.
    this.op = null;
    this.pending = null;
    const line = Math.max(0, Math.min(pos.line, this.buf.lineCount - 1));
    this.cursor = { line, col: Math.max(0, Math.min(pos.col, this.buf.line(line).length)) };
    this.insertStart = { ...this.cursor };
    this.insertUndo = undoSnapshot ?? this.snapshot();
    this.say('');
    this.setMode('insert');
    this.takeCount();
  }

  private insertKey(key: string): void {
    if (key === ESC) {
      this.closeInsert();
      return;
    }
    if (key === CR) {
      this.insertTextAtCursor('\n');
      return;
    }
    if (key === BS) {
      this.backspace();
      return;
    }
    if (key === '<Del>') {
      this.deleteForwardChar();
      return;
    }
    if (key === TAB) {
      this.insertTextAtCursor(' '.repeat(this.tabstop - (this.cursor.col % this.tabstop)));
      return;
    }
    if (key === CTRL_W) {
      this.deleteWordBackward();
      return;
    }
    if (key === CTRL_U) {
      this.deleteToLineStart();
      return;
    }
    if (this.insertRegPending) {
      this.insertRegPending = false;
      const reg = this.readRegister(key);
      if (reg.text) this.insertTextAtCursor(reg.text.replace(/\n$/, ''));
      return;
    }
    if (key === '<C-r>') {
      this.insertRegPending = true;
      return;
    }
    if (key === '<C-o>') {
      this.insertOneShot = true;
      this.setMode('normal');
      return;
    }
    if (key === SPACE || key === ' ') {
      if (this.blockInsertState) {
        this.blockInsertState.text += ' ';
      }
      this.insertTextAtCursor(' ');
      return;
    }
    if (key.length === 1) {
      if (this.blockInsertState) {
        this.blockInsertState.text += key;
        this.insertTextAtCursor(key);
      } else if (this.mode === 'replace') this.replaceCharAtCursor(key);
      else this.insertTextAtCursor(key);
    }
  }

  private insertTextAtCursor(text: string): void {
    const line = this.buf.line(this.cursor.line);
    this.buf.setLine(this.cursor.line, line.slice(0, this.cursor.col) + text + line.slice(this.cursor.col));
    if (text.includes('\n')) {
      const parts = this.buf.line(this.cursor.line).split('\n');
      this.buf.lines.splice(this.cursor.line, 1, ...parts);
      this.buf.setLines(this.buf.lines);
      this.cursor = { line: this.cursor.line + parts.length - 1, col: 0 };
    } else {
      this.cursor = { line: this.cursor.line, col: this.cursor.col + text.length };
    }
    this.lastInsertPos = { ...this.cursor };
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'insert' });
  }

  private replaceCharAtCursor(ch: string): void {
    const line = this.buf.line(this.cursor.line);
    if (this.cursor.col >= line.length) {
      this.insertTextAtCursor(ch);
      return;
    }
    this.buf.setLine(this.cursor.line, line.slice(0, this.cursor.col) + ch + line.slice(this.cursor.col + 1));
    this.cursor = { line: this.cursor.line, col: this.cursor.col + 1 };
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'replace' });
  }

  private backspace(): void {
    if (this.cursor.col === 0) {
      if (this.cursor.line === 0) return;
      const prevLen = this.buf.line(this.cursor.line - 1).length;
      this.buf.setLine(this.cursor.line - 1, this.buf.line(this.cursor.line - 1) + this.buf.line(this.cursor.line));
      this.buf.removeLine(this.cursor.line);
      this.cursor = { line: this.cursor.line - 1, col: prevLen };
    } else {
      const line = this.buf.line(this.cursor.line);
      this.buf.setLine(this.cursor.line, line.slice(0, this.cursor.col - 1) + line.slice(this.cursor.col));
      this.cursor = { line: this.cursor.line, col: this.cursor.col - 1 };
    }
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'delete' });
  }

  private deleteForwardChar(): void {
    const line = this.buf.line(this.cursor.line);
    if (this.cursor.col < line.length) {
      this.buf.setLine(this.cursor.line, line.slice(0, this.cursor.col) + line.slice(this.cursor.col + 1));
      this.version++;
    }
  }

  private deleteWordBackward(): void {
    const line = this.buf.line(this.cursor.line);
    let i = this.cursor.col;
    while (i > 0 && /\s/.test(line[i - 1])) i--;
    while (i > 0 && !/\s/.test(line[i - 1])) i--;
    this.buf.setLine(this.cursor.line, line.slice(0, i) + line.slice(this.cursor.col));
    this.cursor = { line: this.cursor.line, col: i };
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'delete' });
  }

  private deleteToLineStart(): void {
    const line = this.buf.line(this.cursor.line);
    this.buf.setLine(this.cursor.line, line.slice(this.cursor.col));
    this.cursor = { line: this.cursor.line, col: 0 };
    this.version++;
    this.emit({ type: 'change', before: '', after: this.buf.flat, cursor: { ...this.cursor }, kind: 'delete' });
  }

  private closeInsert(): void {
    this.insertOneShot = false;
    this.insertRegPending = false;
    const block = this.blockInsertState;
    this.mode = 'normal';
    this.emit({ type: 'mode', mode: 'normal' });
    if (block) {
      this.blockInsertState = null;
      const text = block.text;
      for (let l = block.l1; l <= block.l2; l++) {
        if (l === block.curLine) continue;
        const line = this.buf.line(l);
        const col = Math.min(block.col, line.length);
        this.buf.setLine(l, line.slice(0, col) + text + line.slice(col));
      }
      this.buf.setLines(this.buf.lines);
      this.cursor = M.moveTo(this.buf, { line: block.l1, col: Math.max(0, block.col + text.length - 1) });
      this.commit(block.snap, 'insert');
      this.wantColValue = this.cursor.col;
      this.takeCount();
      if (!this.replaying) this.lastChangeKeys = this.cmdKeys.slice();
      this.cmdKeys = [];
      return;
    }
    const entry = this.insertUndo;
    this.insertUndo = null;
    if (entry) this.commit(entry, 'insert');
    this.cursor = M.moveTo(this.buf, { line: this.cursor.line, col: Math.max(0, this.cursor.col - 1) });
    this.wantColValue = this.cursor.col;
    this.takeCount();
    if (!this.replaying) this.lastChangeKeys = this.cmdKeys.slice();
    this.cmdKeys = [];
  }

  insertUndo: BufferSnapshot | null = null;
  private insertRegPending = false;
  private insertOneShot = false;

  // ------------------------------------------------------------------ visual

  private visualKey(key: string): void {
    if (key === ESC) {
      this.visualAnchor = null;
      this.setMode('normal');
      this.resetPending();
      return;
    }
    if (key === 'v' && this.mode === 'visual') {
      this.visualAnchor = null;
      this.setMode('normal');
      return;
    }
    if (key === 'V' && this.mode === 'visual-line') {
      this.visualAnchor = null;
      this.setMode('normal');
      return;
    }
    if (key === 'o') {
      const a = this.visualAnchor;
      this.visualAnchor = { ...this.cursor };
      if (a) this.cursor = a;
      this.afterUnit();
      return;
    }
    if (/^[1-9]$/.test(key) || (key === '0' && this.count !== '')) {
      this.count += key;
      return;
    }
    if (this.pending) {
      this.resolvePending(key);
      return;
    }
    if (key === 'g') {
      this.pending = { kind: 'g', op: false };
      return;
    }
    const sel = this.selection();
    switch (key) {
      case 'd':
      case 'x':
      case 'y':
      case 'c':
      case 's': {
        if (!sel) return;
        const reg = this.pendingRegSet;
        const anchor = this.visualAnchor;
        this.pendingRegSet = null;
        this.visualAnchor = null;
        this.cmdKeys = [];
        if (key === 'y') {
          this.yankRange(sel, true, reg, true, false, this.visualMotionKey, false, null, anchor);
          this.visualMotionKey = '';
          this.setMode('normal');
          return;
        }
        // c/s must stay in insert mode: deleteRange(change) calls openInsertAt.
        if (key === 'c' || key === 's') {
          this.deleteRange(sel, true, reg, true);
          return;
        }
        this.deleteRange(sel, true, reg, false);
        this.setMode('normal');
        return;
      }
      case '>':
        if (sel) this.shiftRange(sel, 1);
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case '<':
        if (sel) this.shiftRange(sel, -1);
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case '=':
        if (sel) this.indentRange(sel);
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case '~':
        if (sel) this.caseRange(sel, true, 'toggle', true);
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case 'u':
        if (sel) this.caseRange(sel, true, 'lower', true);
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case 'U':
        if (sel) this.caseRange(sel, true, 'upper', true);
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case 'J':
        if (sel) {
          const l1 = Math.min(sel.start.line, sel.end.line);
          const l2 = Math.max(sel.start.line, sel.end.line);
          const snap = this.snapshot();
          this.buf.lines.splice(l1, l2 - l1 + 1, this.buf.lines.slice(l1, l2 + 1).join(' '));
          this.buf.setLines(this.buf.lines);
          this.cursor = { line: l1, col: 0 };
          this.commit(snap, 'join');
        }
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case 'p':
      case 'P':
        if (sel) this.pasteOver(sel, this.pendingRegSet);
        this.pendingRegSet = null;
        this.visualAnchor = null;
        this.setMode('normal');
        return;
      case 'I':
        if (this.mode === 'visual-block' && sel?.block) {
          this.blockInsert(sel, true);
          return;
        }
        this.setMode('insert');
        return;
      case 'A':
        if (this.mode === 'visual-block' && sel?.block) {
          this.blockInsert(sel, false);
          return;
        }
        this.setMode('insert');
        return;
      case 'r':
        this.pending = { kind: 'char', replace: true };
        return;
      case 'f':
      case 'F':
      case 't':
      case 'T':
        this.pending = { kind: 'find', dir: key === 'f' || key === 't' ? 1 : -1, till: key === 't' || key === 'T' };
        return;
      case 'g':
        this.pending = { kind: 'g', op: false };
        return;
      case ':':
        this.startCmdline(':');
        return;
      default:
        break;
    }
    // In visual-block mode Vim's `$` extends to (virtual) MAXCOL, so a
    // following `h` lands on the last character, not one before it.
    if (
      key === 'l' &&
      (this.mode === 'visual' || this.mode === 'visual-block') &&
      this.count === '' &&
      this.cursor.col === this.buf.line(this.cursor.line).length - 1
    ) {
      // Vim's visual `l` may sit one past EOL; a following `B` then collapses
      // to the start of the current word instead of jumping a word back.
      const line = this.cursor.line;
      this.cursor = { line, col: this.buf.line(line).length };
      this.wantColValue = this.cursor.col;
      this.afterUnit();
      return;
    }
    if (key === '$' && (this.mode === 'visual' || this.mode === 'visual-block') && this.count === '') {
      // Keep the virtual one-past-end column (M.moveTo would clamp it away).
      const line = this.cursor.line;
      this.cursor = { line, col: this.buf.line(line).length };
      this.wantColValue = this.cursor.col;
      this.afterUnit();
      return;
    }
    // motions extend the selection
    const typedCount = this.countNum;
    this.visualMotionKey = key;
    const motion = this.motionFor(key, this.takeCount(), typedCount > 0);
    if (motion) {
      this.moveTo(motion.to, 'char');
      if (this.mode === 'visual-block') {
        // Vim keeps a virtual column at EOL: `)` then `k` on a block starts one
        // past the last character, not on it.
        const line = this.buf.line(this.cursor.line);
        if (this.cursor.col === Math.max(0, line.length - 1)) this.wantColValue = this.cursor.col + 1;
      }
    } else if (key === 'l' || key === 'h' || key === 'j' || key === 'k') {
      this.moveBy({ line: key === 'j' ? 1 : key === 'k' ? -1 : 0, col: key === 'l' ? 1 : key === 'h' ? -1 : 0 });
    } else {
      this.bell();
    }
  }

  selection(): SelRange | null {
    if (!this.visualAnchor) return null;
    const a = this.visualAnchor;
    const b = this.cursor;
    if (this.mode === 'visual-line') {
      return { start: { line: Math.min(a.line, b.line), col: 0 }, end: { line: Math.max(a.line, b.line), col: 0 }, linewise: true };
    }
    if (this.mode === 'visual-block') {
      return {
        start: { line: Math.min(a.line, b.line), col: Math.min(a.col, b.col) },
        end: { line: Math.max(a.line, b.line), col: Math.max(a.col, b.col) },
        linewise: false,
        block: { c1: Math.min(a.col, b.col), c2: Math.max(a.col, b.col), acol: a.col },
      };
    }
    const aIdx = this.buf.idx(a);
    const bIdx = this.buf.idx(b);
    return aIdx <= bIdx ? { start: a, end: b, linewise: false } : { start: b, end: a, linewise: false };
  }

  private pasteOver(sel: SelRange, reg: string | null): void {
    const regData = this.readRegister(reg ?? '"');
    const before = this.snapshot();
    if (sel.block) {
      const l1 = Math.min(sel.start.line, sel.end.line);
      const l2 = Math.max(sel.start.line, sel.end.line);
      const c1 = sel.block.c1;
      const c2 = sel.block.c2;
      const regLines = regData.text.split('\n');
      for (let l = l1; l <= l2; l++) {
        const line = this.buf.line(l);
        const from = Math.min(c1, line.length);
        const to = Math.min(c2 + 1, line.length);
        const repl = regLines[l - l1] ?? '';
        this.buf.setLine(l, line.slice(0, from) + repl + line.slice(to));
      }
      this.buf.setLines(this.buf.lines);
      this.cursor = M.moveTo(this.buf, { line: l1, col: c1 });
      this.wantColValue = this.cursor.col;
      this.commit(before, 'put');
      this.say('replaced selection', 'good');
      return;
    }
    if (sel.linewise) {
      const l1 = Math.min(sel.start.line, sel.end.line);
      const l2 = Math.max(sel.start.line, sel.end.line);
      const raw = regData.linewise ? regData.text.replace(/\n$/, '') : regData.text;
      this.buf.lines.splice(l1, l2 - l1 + 1, ...raw.split('\n'));
      this.buf.setLines(this.buf.lines);
      this.cursor = { line: l1, col: 0 };
    } else {
      const [s, e] = this.flatRange(sel, true);
      this.buf.replaceFlat(s, e, regData.text);
      this.cursor = this.buf.pos(s);
    }
    this.commit(before, 'put');
    this.say('replaced selection', 'good');
  }

  private blockInsert(sel: SelRange, before: boolean): void {
    const block = sel.block!;
    const l1 = Math.min(sel.start.line, sel.end.line);
    const l2 = Math.max(sel.start.line, sel.end.line);
    const col = before ? block.c1 : block.c2 + 1;
    const snap = this.snapshot();
    this.cursor = { line: l1, col };
    this.insertStart = { ...this.cursor };
    this.blockInsertState = { snap, l1, l2, col, curLine: l1, text: '' };
    this.mode = 'insert';
    this.emit({ type: 'mode', mode: 'insert' });
  }

  blockInsertState: { snap: BufferSnapshot; l1: number; l2: number; col: number; curLine: number; text: string } | null = null;

  // ------------------------------------------------------------------ cmdline

  private cmdlineBackup: Pos | null = null;

  private startCmdline(kind: ':' | '/' | '?'): void {
    if (kind === ':' && this.mode !== 'normal') {
      // Visual range command: remember the selection as marks.
      const sel = this.selection();
      if (sel) {
        this.marks.set('<', sel.start);
        this.marks.set('>', sel.end);
      }
    }
    this.cmdKind = kind;
    this.cmdline = '';
    this.cmdlineBackup = { ...this.cursor };
    this.setMode(kind === ':' ? 'cmdline' : 'search');
  }

  private cmdlineKey(key: string): void {
    if (this.cmdHistIndex !== -1 && this.cmdHistIndex < this.history.length && key !== '<Up>' && key !== '<Down>' && key !== '<CR>') {
      this.cmdHistIndex = -1;
    }
    if (key === '<Up>' || key === '<Down>') {
      const hist = this.history.filter((h) => h !== '');
      if (!hist.length) return;
      if (this.cmdHistIndex === -1) this.cmdHistIndex = hist.length;
      this.cmdHistIndex += key === '<Up>' ? -1 : 1;
      this.cmdHistIndex = Math.max(0, Math.min(hist.length - 1, this.cmdHistIndex));
      this.cmdline = hist[this.cmdHistIndex] ?? '';
      if (this.mode === 'search') this.emit({ type: 'search', pattern: this.cmdline });
      return;
    }
    if (key === '<C-r>') {
      this.cmdline += this.readRegister('"').text.replace(/\n/g, ' ');
      return;
    }
    if (key === ESC) {
      this.cmdKind = null;
      this.cmdline = '';
      if (this.cmdlineBackup) this.cursor = this.cmdlineBackup;
      this.setMode(this.mode === 'search' && this.visualAnchor ? 'visual' : 'normal');
      this.emit({ type: 'search', pattern: null });
      return;
    }
    if (key === CR) {
      const input = this.cmdline;
      const kind = this.cmdKind;
      this.cmdKind = null;
      this.cmdline = '';
      this.setMode('normal');
      if (kind === ':') {
        this.history.push(input);
        this.emit({ type: 'ex', command: input });
        executeEx(this, input);
      } else if (this.pendingOpSearch) {
        const op = this.pendingOpSearch;
        this.pendingOpSearch = null;
        this.applySearchOp(op, input, kind === '/' ? 1 : -1);
      } else {
        this.commitSearch(input, kind === '/' ? 1 : -1);
      }
      this.cmdKeys = [];
      return;
    }
    if (key === BS) {
      this.cmdline = this.cmdline.slice(0, -1);
      if (this.cmdline === '' && this.mode === 'search') this.emit({ type: 'search', pattern: null });
      else if (this.mode === 'search') this.emit({ type: 'search', pattern: this.cmdline });
      return;
    }
    if (key === CTRL_U) {
      this.cmdline = '';
      return;
    }
    if (key === CTRL_W) {
      this.cmdline = this.cmdline.replace(/\S+\s*$/, '');
      return;
    }
    if (key === SPACE || key.length === 1) {
      this.cmdline += key === SPACE ? ' ' : key;
      if (this.mode === 'search') this.emit({ type: 'search', pattern: this.cmdline });
    }
  }

  pendingOpSearch: Op | null = null;
  private cmdHistIndex = -1;

  private applySearchOp(op: Op, pattern: string, dir: 1 | -1): void {
    if (!pattern) {
      this.resetPending();
      return;
    }
    this.lastSearch = pattern;
    this.searchDir = dir;
    const matches = this.searchMatches();
    const from = this.buf.idx(this.cursor);
    const m = pickMatch(matches, from, dir, 1);
    if (!m) {
      this.bell();
      this.say(`pattern not found: ${pattern}`, 'error');
      this.resetPending();
      return;
    }
    const dest = this.buf.pos(m.start);
    if (dest.col === 0 && dest.line !== this.cursor.line && dir === 1) {
      this.applyOp(op, { start: { line: this.cursor.line, col: 0 }, end: { line: dest.line - 1, col: 0 }, linewise: true });
      return;
    }
    this.rangeInclusive = false;
    this.applyOp(op, { start: { ...this.cursor }, end: dest, linewise: false });
  }

  get cmdPrompt(): string {
    return this.cmdKind ?? '';
  }

  commitSearch(pattern: string, dir: 1 | -1): void {
    if (!pattern) return;
    this.lastSearch = pattern;
    this.searchDir = dir;
    const found = this.findSearchMatch(1, dir);
    if (found) {
      this.jumpTo(found, true);
      const count = this.searchMatches().length;
      this.say(`/${pattern}  ${count} match${count === 1 ? '' : 'es'}`, 'info');
    } else {
      this.say(`pattern not found: ${pattern}`, 'error');
      this.bell();
    }
    this.emit({ type: 'search', pattern });
    this.afterUnit();
  }

  private searchRepeat(dir: 1 | -1): void {
    if (!this.lastSearch) {
      this.bell();
      this.say('no previous search', 'error');
      return;
    }
    const n = this.takeCount();
    const found = this.findSearchMatch(n, dir);
    if (found) this.jumpTo(found, true);
    else this.bell();
    this.afterUnit();
  }

  private starSearch(forward: boolean, wordBoundaries = true): void {
    const line = this.buf.line(this.cursor.line);
    const re = /[A-Za-z0-9_]+|[\u0080-\uffff]+/g;
    let m: RegExpExecArray | null;
    let word = '';
    let wordStart = -1;
    while ((m = re.exec(line))) {
      if (m.index <= this.cursor.col && this.cursor.col < m.index + m[0].length) {
        word = m[0];
        wordStart = m.index;
        break;
      }
      if (m.index > this.cursor.col) break;
    }
    if (!word) {
      this.bell();
      return;
    }
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.lastSearch = wordBoundaries ? `\\<${escaped}\\>` : escaped;
    this.searchDir = forward ? 1 : -1;
    // `*`/`g*` search from *after* the word under the cursor (and `#`/`g#`
    // from before it), so a count skips the word you are standing on.
    const saved = { ...this.cursor };
    this.cursor = { line: this.cursor.line, col: forward ? Math.min(line.length, wordStart + word.length) : Math.max(0, wordStart - 1) };
    const found = this.findSearchMatch(this.countNum || 1, this.searchDir);
    if (found) this.jumpTo(found, true);
    else {
      this.cursor = saved;
      this.bell();
    }
    this.emit({ type: 'search', pattern: this.lastSearch });
    this.afterUnit();
  }

  searchMatches(pattern = this.lastSearch): Match[] {
    if (!pattern) return [];
    const re = compilePattern(pattern, { smartcase: true });
    if (!re) return [];
    return allMatches(this.buf.flat, re);
  }

  private findSearchMatch(count: number, dir: 1 | -1): Pos | null {
    if (!this.lastSearch) return null;
    const matches = this.searchMatches();
    const from = this.buf.idx(this.cursor);
    const m = pickMatch(matches, from, dir, count);
    return m ? this.buf.pos(m.start) : null;
  }

  // ------------------------------------------------------------- pending keys

  private resolvePending(key: string): void {
    const p = this.pending!;
    if (key === ESC) {
      this.resetPending();
      return;
    }
    switch (p.kind) {
      case 'find': {
        this.pending = null;
        if (key.length !== 1) {
          this.bell();
          this.resetPending();
          return;
        }
        if (this.op) {
          const op = this.op;
          const n = (this.countNum || 1) * (op.count || 1);
          this.count = '';
          const motion = M.findChar(this.motionEnv(), key, p.dir, p.till, n);
          this.lastFind = { char: key, dir: p.dir, till: p.till };
          if (!motion) {
            this.bell();
            this.resetPending();
            return;
          }
          if (
            (op.key === 'g~' || op.key === 'gu' || op.key === 'gU') &&
            p.till &&
            p.dir === -1 &&
            motion.to.line === this.cursor.line &&
            motion.to.col === this.cursor.col
          ) {
            // A backward `T` that lands on the cursor is a zero-length motion;
            // Vim's case operators refuse it instead of toggling one char.
            this.bell();
            this.resetPending();
            return;
          }
          this.finishOpWithMotion(op, motion, key);
        } else {
          this.doFind(key, p.dir, p.till, this.countNum || 1);
        }
        return;
      }
      case 'char': {
        this.pending = null;
        if (this.mode === 'visual' || this.mode === 'visual-line') {
          const sel = this.selection();
          this.visualAnchor = null;
          this.setMode('normal');
          if (!sel) return;
          this.takeCount();
          const before = this.snapshot();
          const l1 = Math.min(sel.start.line, sel.end.line);
          const l2 = Math.max(sel.start.line, sel.end.line);
          for (let l = l1; l <= l2; l++) {
            const line = this.buf.line(l);
            const a = l === l1 ? sel.start.col : 0;
            const b = l === l2 ? sel.end.col + 1 : line.length;
            this.buf.setLine(l, line.slice(0, a) + key.repeat(Math.max(0, b - a)) + line.slice(b));
          }
          this.buf.setLines(this.buf.lines);
          this.commit(before, 'replace');
          this.afterUnit();
          return;
        }
        const n = this.countNum || 1;
        this.takeCount();
        const line = this.buf.line(this.cursor.line);
        const end = Math.min(line.length, this.cursor.col + n);
        if (end <= this.cursor.col) {
          this.bell();
          this.afterUnit();
          return;
        }
        const before = this.snapshot();
        this.buf.setLine(this.cursor.line, line.slice(0, this.cursor.col) + key.repeat(end - this.cursor.col) + line.slice(end));
        this.cursor = { line: this.cursor.line, col: end - 1 };
        this.wantColValue = this.cursor.col;
        this.commit(before, 'replace');
        this.afterUnit();
        return;
      }
      case 'mark': {
        this.pending = null;
        if (p.set) {
          this.marks.set(key, { ...this.cursor });
          this.say(`mark ${key} set`, 'info');
          this.afterUnit();
          return;
        }
        const mark = this.marks.get(key);
        if (!mark) {
          this.bell();
          this.say(`mark ${key} not set`, 'error');
          this.afterUnit();
          return;
        }
        const pos = p.jump === 'line' ? { line: mark.line, col: M.firstNonBlank(this.buf, mark.line) } : mark;
        if (this.op) {
          const op = this.op;
          const motion: MotionResult = { to: pos, kind: 'linewise' };
          this.finishOpWithMotion(op, motion, key);
        } else {
          this.jumpTo(pos, true);
          this.afterUnit();
        }
        return;
      }
      case 'g': {
        this.pending = null;
        this.afterG(key, p.op);
        return;
      }
      case 'z': {
        this.pending = null;
        if (key === 'z' || key === 't' || key === 'b') {
          this.say('viewport is the whole scroll', 'info');
        }
        this.afterUnit();
        return;
      }
      case 'macro-record': {
        this.pending = null;
        if (/^[a-z0-9]$/.test(key)) {
          this.recording = { reg: key, keys: [] };
          this.say(`recording @${key}`, 'info');
        } else {
          this.bell();
        }
        return;
      }
      case 'macro-run': {
        this.pending = null;
        this.runMacro(key);
        return;
      }
      case 'reg': {
        this.pending = null;
        return;
      }
      case 'textobj': {
        this.pending = null;
        const obj = textObject(this.buf, this.cursor, p.around, key);
        if (!obj) {
          // A *missing* object is an error/no-op for every operator. An empty
          // pair is different: textObject returns `empty`, handled below, and
          // shift operators still act on the line there.
          this.bell();
          this.say(`no ${p.around ? 'a' : 'i'}${key} here`, 'error');
          this.resetPending();
          return;
        }
        const op = this.op;
        if (!op) return;
        if (obj.empty) {
          this.count = '';
          // Vim's shift operators still act on the current line for an empty
          // pair; delete/yank/case leave the text alone but move the cursor to
          // the closing delimiter, and change inserts just before it.
          if (op.key === '<' || op.key === '>') {
            this.applyOp(op, { start: { line: this.cursor.line, col: 0 }, end: { line: this.cursor.line, col: 0 }, linewise: true });
            return;
          }
          if (op.key === 'c') {
            this.openInsertAt(obj.start);
            return;
          }
          this.resetPending(false);
          this.cursor = M.moveTo(this.buf, obj.start);
          this.wantColValue = this.cursor.col;
          this.afterUnit();
          return;
        }
        const count = (this.countNum || 1) * (this.op ? this.op.count || 1 : 1);
        this.count = '';
        if (count > 1 && obj.fallback) {
          this.bell();
          this.resetPending();
          return;
        }
        let start = obj.start;
        let end = obj.end;
        if (count > 1) {
          const quoteKeys = key === '"' || key === "'" || key === '`';
          if (quoteKeys) {
            // `2i"` selects the quote pair (quotes included, no trailing
            // space); `2a"` is the same around object Vim uses for count 1
            // (including the trailing space). Higher counts clamp.
            const outer = textObject(this.buf, this.cursor, true, key);
            if (!outer) {
              this.bell();
              this.resetPending();
              return;
            }
            start = outer.start;
            end = outer.end;
            if (!p.around) {
              // `2i"` selects the quote pair only: drop the surrounding
              // whitespace that the around object may have picked up.
              const line = this.buf.line(end.line);
              while (start.col < end.col && (line[start.col] === ' ' || line[start.col] === '\t')) {
                start = { line: start.line, col: start.col + 1 };
              }
              while (end.col > start.col && (line[end.col] === ' ' || line[end.col] === '\t')) {
                end = { line: end.line, col: end.col - 1 };
              }
            }
          } else if (key !== 'w' && key !== 'W' && key !== 'p') {
            // A counted bracket/tag object needs a second nesting level; with
            // only one level Vim errors. No outer-object expansion yet, so
            // refuse instead of fabricating a longer range.
            this.bell();
            this.resetPending();
            return;
          } else {
          const list = key === 'w' || key === 'W' ? tokens(this.buf, key === 'W') : [];
          const off = this.buf.idx(this.cursor);
          let ti = list.findIndex((t) => !t.blank && t.start <= off && off <= t.end);
          // A counted WORD object needs `count` WORDs ahead (Vim refuses
          // `2diW` on the last WORD instead of clamping the delete).
          const shiftOp = this.op && (this.op.key === '>' || this.op.key === '<');
          // Shift operators with a count > 2 fall back to the line-shift path
          // when the WORD object runs out (Vim `3>iW`); other cases refuse.
          const checkW = (key === 'w' || key === 'W') && ti >= 0 && !(shiftOp && count > 2);
          if (checkW) {
            const available = list.slice(ti).filter((t) => !t.blank).length;
            // Vim clamps a count one past the last WORD (`3diw` with two words
            // left deletes both); a larger overshoot is refused.
            const clampable = available >= 2 && count === available + 1;
            if (available < count && !clampable) {
              // Vim refuses but parks the cursor on the last character of the
              // current WORD (the motion's partial endpoint).
              this.cursor = M.moveTo(this.buf, obj.end);
              this.bell();
              this.resetPending();
              this.afterUnit();
              return;
            }
          }
          if (!p.around && (key === 'w' || key === 'W')) {
            const flat = this.buf.flat;
            const onWhitespace = ti < 0;
            if (ti < 0) ti = list.findIndex((t) => !t.blank && t.start >= off);
            if (ti >= 0) {
              const first = list[ti];
              const startOff = onWhitespace ? this.buf.idx(obj.start) : first.start;
              // On whitespace the blank run itself is the first unit.
              let endOff = onWhitespace ? this.buf.idx(obj.end) : first.end;
              let units = 1;
              while (units < count) {
                const j = endOff + 1;
                if (j >= flat.length) break;
                if (flat[j] === '\n') {
                  // A blank line is itself a unit (`2iw` on "a\n\nb" stops
                  // after the empty line); a plain line break is skipped.
                  if (j + 1 < flat.length && flat[j + 1] === '\n') {
                    endOff = j + 1;
                    units++;
                    continue;
                  }
                  let k = j;
                  while (k < flat.length && (flat[k] === '\n' || flat[k] === ' ' || flat[k] === '\t')) k++;
                  if (k >= flat.length) break;
                  const nt = list.find((t) => !t.blank && t.start === k) ?? list.find((t) => !t.blank && t.start >= k);
                  if (!nt) break;
                  endOff = nt.end;
                  units++;
                  continue;
                }
                if (flat[j] === ' ' || flat[j] === '\t') {
                  // A run of spaces is one unit: `2iw` on the last word of a
                  // line selects the word plus its trailing spaces.
                  let e = j;
                  while (e + 1 < flat.length && (flat[e + 1] === ' ' || flat[e + 1] === '\t')) e++;
                  endOff = e;
                  units++;
                  continue;
                }
                // Adjacent token (punctuation or a word with no space).
                const nt = list.find((t) => !t.blank && t.start === j);
                if (!nt) break;
                endOff = nt.end;
                units++;
              }
              start = this.buf.pos(startOff);
              end = this.buf.pos(endOff);
              const caseOrChange = op.key === 'c' || op.key === 'g~' || op.key === 'gu' || op.key === 'gU';
              // `W` objects are linewise across lines for every operator; a
              // lowercase `w` is linewise only for change/case from column 0
              // (delete stays charwise: `2diw` across lines joins).
              if ((key === 'W' || (key === 'w' && caseOrChange)) && start.line !== end.line && (!caseOrChange || start.col === 0)) {
                obj.linewise = true;
              }
            }
          } else if (p.around && (key === 'w' || key === 'W')) {
            // `2daW`/`2daw`: select `count` words and the whitespace after the
            // last one, across lines (Vim joins the lines when this is deleted).
            if (ti < 0) {
              // Cursor on whitespace: the blank run plus the next word is the
              // first object, then count-1 further words.
              ti = list.findIndex((t) => !t.blank && t.start > off);
              const target = ti >= 0 ? list[Math.min(list.length - 1, ti + count - 1)] : null;
              if (target) {
                start = obj.start;
                end = this.buf.pos(target.end);
              }
            } else {
              let idx = ti;
              for (let u = 1; u < count && idx < list.length - 1; u++) {
                idx++;
                // Blank lines are not words to count, but stay inside the range.
                while (idx < list.length - 1 && list[idx].blank) idx++;
              }
              const target = list[idx];
              if (target) {
                let e = target.end;
                const flat = this.buf.flat;
                while (e + 1 < flat.length && (flat[e + 1] === ' ' || flat[e + 1] === '\t')) e++;
                let startOff = list[ti].start;
                // No whitespace after the last word: Vim takes the whitespace
                // *before* the first word instead (so `2daw` on `x = (a)` eats
                // ` = (` rather than `= (`).
                if (e === target.end) {
                  let j = startOff - 1;
                  while (j >= 0 && (flat[j] === ' ' || flat[j] === '\t')) j--;
                  // Do not swallow line indentation: the run must start after
                  // a real character on the same line (a newline means col 0).
                  if (j >= 0 && j < startOff - 1 && flat[j] !== '\n') startOff = j + 1;
                }
                start = this.buf.pos(startOff);
                end = this.buf.pos(e);
              }
            }
          } else if (!p.around && key === 'p' && obj.linewise && count === 2) {
            // `2ip` = the paragraph plus its following blank run; it fails when
            // the paragraph is the last one (Vim has no second unit to take).
            if (end.line + 1 >= this.buf.lineCount || this.buf.line(end.line + 1).trim() !== '') {
              this.bell();
              this.resetPending();
              return;
            }
            while (end.line + 1 < this.buf.lineCount && this.buf.line(end.line + 1).trim() === '') {
              end = { line: end.line + 1, col: Math.max(0, this.buf.line(end.line + 1).length - 1) };
            }
          } else if (p.around && key === 'p' && obj.linewise) {
            // Counted `ap` needs `count` paragraphs from the cursor; otherwise
            // Vim refuses (`2dap` in the last paragraph is a no-op).
            const blankAt = (l: number) => this.buf.line(l).trim() === '';
            let paraStart = this.cursor.line;
            while (paraStart > 0 && !blankAt(paraStart - 1)) paraStart--;
            let avail = 0;
            let probe = paraStart;
            while (probe < this.buf.lineCount) {
              while (probe < this.buf.lineCount && blankAt(probe)) probe++;
              if (probe >= this.buf.lineCount) break;
              avail++;
              while (probe < this.buf.lineCount && !blankAt(probe)) probe++;
            }
            if (avail < count) {
              this.bell();
              this.resetPending();
              return;
            }
            // Counted `ap` repeats the paragraph: cross the blank separator and
            // the next paragraph `count - 1` times, including the blanks that
            // surround the result (Vim counts the separator inside the range).
            let last = end.line;
            for (let k = 1; k < count; k++) {
              while (last + 1 < this.buf.lineCount && this.buf.line(last + 1).trim() === '') last++;
              let n = last + 1;
              if (n >= this.buf.lineCount) break;
              while (n < this.buf.lineCount && this.buf.line(n).trim() !== '') {
                last = n;
                n++;
              }
            }
            while (last + 1 < this.buf.lineCount && this.buf.line(last + 1).trim() === '') last++;
            while (start.line > 0 && this.buf.line(start.line - 1).trim() === '') start = { line: start.line - 1, col: 0 };
            end = { line: last, col: Math.max(0, this.buf.line(last).length - 1) };
          } else {
            // Repeat the object outward (approximation of Vim's behaviour).
            const line = this.buf.line(end.line);
            if (obj.linewise) end = { line: Math.min(this.buf.lineCount - 1, end.line + count - 1), col: 0 };
            else end = { line: end.line, col: Math.min(Math.max(0, line.length - 1), end.col + count - 1) };
          }
          }
        }
        if (obj.linewise && op.key !== 'c' && op.key !== 'y' && op.key !== 'd') {
          this.fromTextObject = true;
          this.applyOp(op, { start, end, linewise: true });
          return;
        }
        this.rangeInclusive = true;
        this.fromTextObject = true;
        this.applyOp(op, { start, end, linewise: obj.linewise === true });
        return;
      }
    }
  }

  private afterG(key: string, asOp: boolean): void {
    if (this.mode.startsWith('visual')) this.visualMotionKey = key === 'g' ? 'gg' : key;
    if (key === '*' || key === '#') {
      this.starSearch(key === '*', false);
      return;
    }
    if (key === 'n') {
      // gn: the next match of the last search. In operator-pending mode it is
      // the range for dgn/cgn; otherwise it starts a visual selection on it.
      if (!this.lastSearch) {
        this.bell();
        return;
      }
      const matches = this.searchMatches();
      if (!matches.length) {
        this.bell();
        return;
      }
      const from = this.buf.idx(this.cursor);
      let base = matches.findIndex((m) => m.start <= from && from < m.end);
      if (base < 0) base = matches.findIndex((m) => m.start >= from);
      if (base < 0) base = 0;
      const count = (this.countNum || 1) * (this.op?.count || 1);
      if (this.countNum) this.takeCount();
      const target = matches[(base + count - 1) % matches.length];
      const start = this.buf.pos(target.start);
      const end = this.buf.pos(target.end - 1);
      if (asOp && this.op) {
        const op = this.op;
        this.rangeInclusive = true;
        this.applyOp(op, { start, end, linewise: false });
        return;
      }
      if (this.mode === 'visual' || this.mode === 'visual-line' || this.mode === 'visual-block') {
        this.cursor = M.moveTo(this.buf, end);
        this.afterUnit();
        return;
      }
      this.visualAnchor = start;
      this.cursor = M.moveTo(this.buf, end);
      this.setMode('visual');
      this.afterUnit();
      return;
    }
    if (key === 'g') {
      if (asOp && this.op) {
        const op = this.op;
        const n = (this.countNum || 1) * (op.count || 1);
        const explicit = this.countNum > 0 || op.count > 0;
        const last = this.buf.lineCount - 1;
        const targetLine = explicit ? Math.min(n - 1, last) : 0;
        this.finishOpWithMotion(op, {
          to: { line: targetLine, col: M.firstNonBlank(this.buf, targetLine) },
          kind: 'linewise',
          jump: true,
        }, 'gg');
        return;
      }
      const n = this.countNum || 1;
      this.takeCount();
      const line = Math.min(this.buf.lineCount - 1, n - 1);
      this.jumpTo({ line, col: M.firstNonBlank(this.buf, line) }, true);
      this.afterUnit();
      return;
    }
    if (key === 'e' || key === 'E') {
      const n = this.countNum || 1;
      this.takeCount();
      const res = M.wordMotion(this.motionEnv(), n, { dir: -1, end: true, big: key === 'E' });
      if (res) this.moveTo(res.to, 'char');
      this.afterUnit();
      return;
    }
    if (key === 'J') {
      this.joinLines(this.countNum || 2, false);
      return;
    }
    if (key === 'v') {
      this.visualAnchor = this.visualAnchor ?? { ...this.cursor };
      this.setMode('visual');
      this.afterUnit();
      return;
    }
    if (key === 'i') {
      const pos = this.lastInsertPos ?? this.cursor;
      this.openInsertAt(pos);
      return;
    }
    if (key === 'I') {
      this.openInsertAt({ line: this.cursor.line, col: 0 });
      return;
    }
    if (key === '~' || key === 'u' || key === 'U' || key === 'q' || key === 'w') {
      const opKey = 'g' + key;
      if (asOp && this.op) {
        this.op.key = opKey;
        this.pending = null;
        return;
      }
      this.op = { key: opKey, count: this.countNum, motionCount: 0, reg: this.pendingRegSet, doubled: false };
      this.pendingRegSet = null;
      this.count = '';
      return;
    }
    this.bell();
    this.afterUnit();
  }

  // ------------------------------------------------------------------ macros

  private stopRecording(): void {
    if (!this.recording) return;
    const { reg, keys } = this.recording;
    this.registers.set(reg, { text: keys.join(''), linewise: false });
    this.recording = null;
    this.say(`recorded @${reg} (${keys.length} keys)`, 'good');
  }

  private runMacro(regName: string): void {
    let name = regName;
    if (name === '@') name = this.lastMacro ?? '';
    if (!name) {
      this.bell();
      return;
    }
    const reg = this.registers.get(name);
    if (!reg || !reg.text) {
      this.bell();
      this.say(`register ${name} is empty`, 'error');
      return;
    }
    this.lastMacro = name;
    const n = this.countNum || 1;
    this.takeCount();
    const keys = tokenize(reg.text);
    this.replaying = true;
    for (let i = 0; i < n; i++) for (const k of keys) this.feed(k);
    this.replaying = false;
    this.cmdKeys = [];
    this.say(`@${name} x${n}`, 'good');
  }

  // -------------------------------------------------------------------- misc

  clampCursor(): void {
    this.cursor = M.moveTo(this.buf, this.cursor);
  }

  // ---------------------------------------------------------------- ex layer

  echo(text: string, level: 'info' | 'error' | 'good' = 'info'): void {
    this.say(text, level);
  }

  /** 1-based line jump. */
  gotoLine(n: number): void {
    const line = Math.max(0, Math.min(this.buf.lineCount - 1, n - 1));
    this.cursor = { line, col: M.firstNonBlank(this.buf, line) };
    this.wantColValue = this.cursor.col;
    this.pushJump(this.cursor);
    this.afterUnit();
  }

  private translateReplacement(rep: string): string {
    let out = '';
    for (let i = 0; i < rep.length; i++) {
      const c = rep[i];
      if (c === '\\') {
        const n = rep[i + 1];
        i++;
        if (n === '&') out += '&';
        else if (n === '\\') out += '\\';
        else if (n === 'n' || n === 'r') out += '\n';
        else if (n && /[0-9]/.test(n)) out += '$' + n;
        else if (n === 'u' || n === 'l' || n === 'U' || n === 'L' || n === 'e') out += '';
        else out += n ?? '';
      } else if (c === '&') {
        out += '$&';
      } else if (c === '$') {
        out += '$$';
      } else {
        out += c;
      }
    }
    return out;
  }

  private subReplacement(c: SubConfirm, line: string, m: SubMatch): string {
    const re = new RegExp(c.source, c.flags + 'y');
    const rest = line.slice(m.col);
    const out = rest.replace(re, c.jsRep);
    return out.slice(0, out.length - rest.slice(m.len).length);
  }

  private applySubMatch(): void {
    const c = this.subConfirm;
    if (!c) return;
    const m = c.matches[c.index];
    if (!m) return;
    const line = c.lines[m.line];
    const text = this.subReplacement(c, line, m);
    c.lines[m.line] = line.slice(0, m.col) + text + line.slice(m.col + m.len);
    const delta = text.length - m.len;
    if (delta !== 0) {
      for (let i = c.index + 1; i < c.matches.length; i++) {
        const later = c.matches[i];
        if (later.line === m.line && later.col > m.col) later.col += delta;
      }
    }
    c.applied++;
    this.buf.setLines(c.lines);
    this.cursor = { line: m.line, col: m.col };
    this.wantColValue = this.cursor.col;
  }

  private nextSubMatch(): void {
    const c = this.subConfirm;
    if (!c) return;
    c.index++;
    if (c.index >= c.matches.length) {
      this.finishSubConfirm();
      return;
    }
    const m = c.matches[c.index];
    this.cursor = { line: m.line, col: m.col };
    this.wantColValue = this.cursor.col;
    this.echo(this.confirmPrompt ?? '', 'info');
  }

  private finishSubConfirm(): void {
    const c = this.subConfirm;
    if (!c) return;
    this.subConfirm = null;
    if (c.applied > 0) {
      this.buf.setLines(c.lines);
      this.commit(c.before, 'substitute');
      this.echo(`${c.applied} substitution${c.applied === 1 ? '' : 's'}`, 'good');
    } else {
      this.buf.setLines(c.before.lines);
      this.cursor = { ...c.before.cursor };
      this.echo('0 substitutions', 'info');
    }
    this.afterUnit();
  }

  private abortSubConfirm(): void {
    const c = this.subConfirm;
    if (!c) return;
    this.subConfirm = null;
    this.buf.setLines(c.before.lines);
    this.cursor = { ...c.before.cursor };
    this.wantColValue = this.cursor.col;
    this.echo('', 'info');
    this.afterUnit();
  }

  private confirmKey(key: string): void {
    if (key === ESC) {
      this.abortSubConfirm();
      return;
    }
    if (key === 'y') {
      this.applySubMatch();
      this.nextSubMatch();
      return;
    }
    if (key === 'n') {
      this.nextSubMatch();
      return;
    }
    if (key === 'a') {
      while (this.subConfirm && this.subConfirm.index < this.subConfirm.matches.length) {
        this.applySubMatch();
        if (this.subConfirm) this.subConfirm.index++;
      }
      this.finishSubConfirm();
      return;
    }
    if (key === 'l') {
      this.applySubMatch();
      this.finishSubConfirm();
      return;
    }
    if (key === 'q') {
      this.finishSubConfirm();
      return;
    }
    this.bell();
  }

  exSubstitute(l1: number, l2: number, pat: string, rep: string, flags: string): void {
    let pattern = pat;
    let replacement = rep;
    let f = flags;
    if (f.includes('&') || (pattern === '' && replacement === '' && this.lastSubstitute)) {
      if (!this.lastSubstitute) {
        this.echo('E35: no previous regular expression', 'error');
        return;
      }
      pattern = this.lastSubstitute.pat;
      replacement = this.lastSubstitute.rep;
      f = this.lastSubstitute.flags;
    } else {
      if (pattern === '' && this.lastSearch) pattern = this.lastSearch;
      this.lastSubstitute = { pat: pattern, rep: replacement, flags: f };
    }
    const base = compilePattern(pattern, { smartcase: true });
    if (!base) {
      this.echo(`E486: pattern not found: ${pattern}`, 'error');
      return;
    }
    const flags2 = base.flags.includes('g') ? base.flags : base.flags + 'g';
    const reGlobal = new RegExp(base.source, flags2);
    const reOnce = new RegExp(base.source, base.flags.replace('g', ''));
    const lines = this.buf.lines.slice();
    const jsRep = this.translateReplacement(replacement);
    const before = this.snapshot();

    if (f.includes('c')) {
      const confirmLines = lines.slice();
      const matches: SubMatch[] = [];
      const scan = new RegExp(base.source, base.flags);
      for (let l = Math.max(0, l1); l <= Math.min(confirmLines.length - 1, l2); l++) {
        scan.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = scan.exec(confirmLines[l]))) {
          if (m[0].length === 0) {
            scan.lastIndex++;
            continue;
          }
          matches.push({ line: l, col: m.index, len: m[0].length });
          if (!f.includes('g')) break;
        }
      }
      if (!matches.length) {
        this.echo(`E486: pattern not found: ${pattern}`, 'error');
        return;
      }
      this.subConfirm = {
        before,
        lines: confirmLines,
        matches,
        index: 0,
        replacement,
        jsRep,
        source: base.source,
        flags: base.flags.replace('g', ''),
        applied: 0,
      };
      const first = matches[0];
      this.cursor = { line: first.line, col: first.col };
      this.wantColValue = this.cursor.col;
      this.echo(this.confirmPrompt ?? '', 'info');
      return;
    }

    let total = 0;
    let lastLine = -1;
    let delta = 0;
    for (let l = Math.max(0, l1); l <= Math.min(lines.length - 1, l2); l++) {
      const line = lines[l];
      const hits = f.includes('g') ? line.match(reGlobal)?.length ?? 0 : redge(reOnce, line);
      if (hits === 0) continue;
      const next = line.replace(f.includes('g') ? reGlobal : reOnce, jsRep);
      const parts = next.split('\n');
      lines.splice(l + delta, 1, ...parts);
      delta += parts.length - 1;
      total += hits;
      lastLine = l + delta;
    }
    if (total === 0) {
      this.echo(`E486: pattern not found: ${pattern}`, 'error');
      return;
    }
    this.buf.setLines(lines);
    this.cursor = { line: Math.min(this.buf.lineCount - 1, Math.max(0, lastLine)), col: 0 };
    this.wantColValue = 0;
    this.commit(before, 'substitute');
    this.echo(`${total} substitution${total === 1 ? '' : 's'}`, 'good');
    this.afterUnit();
  }

  exDeleteLines(l1: number, l2: number): void {
    const a = Math.max(0, Math.min(l1, l2));
    const b = Math.min(this.buf.lineCount - 1, Math.max(l1, l2));
    const before = this.snapshot();
    const removed = this.buf.lines.splice(a, b - a + 1);
    if (this.buf.lines.length === 0) this.buf.setLines(['']);
    else this.buf.setLines(this.buf.lines);
    this.storeRegister(null, removed.join('\n') + '\n', true, false);
    this.cursor = { line: Math.min(a, this.buf.lineCount - 1), col: 0 };
    this.commit(before, 'delete');
    this.echo(`${removed.length} line(s) deleted`, 'good');
    this.afterUnit();
  }

  exCopyLines(l1: number, l2: number, dest: number): void {
    const a = Math.max(0, Math.min(l1, l2));
    const b = Math.min(this.buf.lineCount - 1, Math.max(l1, l2));
    const before = this.snapshot();
    const block = this.buf.lines.slice(a, b + 1);
    const at = Math.max(0, Math.min(this.buf.lines.length, dest + 1));
    this.buf.lines.splice(at, 0, ...block);
    this.buf.setLines(this.buf.lines);
    this.cursor = { line: Math.min(at, this.buf.lineCount - 1), col: M.firstNonBlank(this.buf, Math.min(at, this.buf.lineCount - 1)) };
    this.commit(before, 'put');
    this.echo(`${block.length} line(s) copied`, 'good');
    this.afterUnit();
  }

  exMoveLines(l1: number, l2: number, dest: number): void {
    const a = Math.max(0, Math.min(l1, l2));
    const b = Math.min(this.buf.lineCount - 1, Math.max(l1, l2));
    const before = this.snapshot();
    const block = this.buf.lines.splice(a, b - a + 1);
    const at = Math.max(0, Math.min(this.buf.lines.length, dest < a ? dest + 1 : dest - block.length + 1));
    this.buf.lines.splice(at, 0, ...block);
    this.buf.setLines(this.buf.lines);
    this.cursor = { line: Math.min(at, this.buf.lineCount - 1), col: M.firstNonBlank(this.buf, Math.min(at, this.buf.lineCount - 1)) };
    this.commit(before, 'move');
    this.echo(`${block.length} line(s) moved`, 'good');
    this.afterUnit();
  }

  exGlobal(pat: string, cmd: string, invert: boolean): void {
    const re = compilePattern(pat, { smartcase: true });
    if (!re) {
      this.echo(`E486: pattern not found: ${pat}`, 'error');
      return;
    }
    const reLine = new RegExp(re.source);
    const lines: number[] = [];
    for (let l = 0; l < this.buf.lineCount; l++) {
      const hit = reLine.test(this.buf.line(l));
      if (hit !== invert) lines.push(l);
    }
    if (lines.length === 0) {
      this.echo(`pattern not found: ${pat}`, 'error');
      return;
    }
    if (cmd === 'd' || cmd === 'delete') {
      const before = this.snapshot();
      for (let i = lines.length - 1; i >= 0; i--) this.buf.lines.splice(lines[i], 1);
      if (this.buf.lines.length === 0) this.buf.setLines(['']);
      else this.buf.setLines(this.buf.lines);
      this.cursor = { line: Math.min(lines[0], this.buf.lineCount - 1), col: 0 };
      this.commit(before, 'delete');
      this.echo(`${lines.length} line(s) deleted`, 'good');
      return;
    }
    if (cmd === 'p' || cmd === 'print') {
      this.echo(lines.map((l) => this.buf.line(l)).join(' | '), 'info');
      return;
    }
    if (cmd.startsWith('s') && cmd.length > 1) {
      const args = /^(.)(.*?)\1(.*?)(\1([a-z]*))?$/.exec(cmd.slice(1));
      const before = this.snapshot();
      let total = 0;
      for (const l of lines) {
        const line = this.buf.line(l);
        const reSrc = compilePattern(args?.[2] ?? '', { smartcase: true });
        if (!reSrc) continue;
        const g = new RegExp(reSrc.source, args?.[5]?.includes('g') ? 'g' : '');
        const next = line.replace(g, this.translateReplacement(args?.[3] ?? ''));
        if (next !== line) {
          this.buf.setLine(l, next);
          total++;
        }
      }
      this.buf.setLines(this.buf.lines);
      this.commit(before, 'substitute');
      this.echo(`${total} line(s) changed`, 'good');
      return;
    }
    if (cmd.startsWith('normal') || cmd.startsWith('norm')) {
      const keys = cmd.replace(/^norm(al)?\s*/, '');
      this.exNormal(lines[0], lines[lines.length - 1], keys);
      return;
    }
    this.echo(`E492: not supported: :g/${pat}/${cmd}`, 'error');
  }

  exNormal(l1: number, l2: number, keys: string): void {
    if (!keys) return;
    const toks = tokenize(keys);
    this.replaying = true;
    for (let l = Math.max(0, l1); l <= Math.min(this.buf.lineCount - 1, l2); l++) {
      this.cursor = { line: l, col: 0 };
      for (const k of toks) this.feed(k);
      // Vim's :normal always finishes the line in normal mode.
      if (this.mode === 'insert' || this.mode === 'replace') this.feed('<Esc>');
    }
    this.replaying = false;
    this.cmdKeys = [];
    this.echo(`normal! on ${l2 - l1 + 1} line(s)`, 'good');
  }

  exSort(l1: number, l2: number, args: string): void {
    const a = Math.max(0, Math.min(l1, l2));
    const b = Math.min(this.buf.lineCount - 1, Math.max(l1, l2));
    const block = this.buf.lines.slice(a, b + 1);
    const numeric = args.includes('n');
    const unique = args.includes('u');
    const fold = args.includes('i');
    const reverse = args.includes('!');
    const key = (s: string) => (fold ? s.toLowerCase() : s);
    block.sort((x, y) => {
      if (numeric) {
        const nx = parseFloat(x.replace(/[^0-9.+-]/g, '')) || 0;
        const ny = parseFloat(y.replace(/[^0-9.+-]/g, '')) || 0;
        return nx - ny;
      }
      return key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0;
    });
    const out = unique ? block.filter((x, i) => i === 0 || x !== block[i - 1]) : block;
    if (reverse) out.reverse();
    const before = this.snapshot();
    this.buf.lines.splice(a, b - a + 1, ...out);
    this.buf.setLines(this.buf.lines);
    this.cursor = { line: a, col: 0 };
    this.commit(before, 'sort');
    this.echo(`${out.length} line(s) sorted`, 'good');
    this.afterUnit();
  }

  /** True when the buffer content matches another. */
  get text(): string {
    return this.buf.flat;
  }

  setText(text: string): void {
    this.buf.setLines(text.split('\n'));
    this.cursor = { line: 0, col: 0 };
    this.undoStack = [];
    this.redoStack = [];
    this.clampCursor();
  }
}
