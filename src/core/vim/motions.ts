import { Buffer } from './buffer.ts';
import type { MotionResult, Pos } from './types.ts';
import { tokenAt, tokens, type Token } from './wordindex.ts';

/**
 * Motions.
 *
 * Implemented against the token index in wordindex.ts. Word motion semantics
 * follow Vim: `w` stops at the next token start, `e` at the next token end,
 * `b`/`ge` walk backwards. WORD variants merge punctuation runs.
 */

export interface MotionEnv {
  buf: Buffer;
  cursor: Pos;
  /** Desired column remembered for j/k. */
  wantCol: number;
  lastFind: { char: string; dir: 1 | -1; till: boolean } | null;
  marks: Map<string, Pos>;
  getMark(name: string): Pos | null;
  searchNext(from: Pos, count: number, dir: 1 | -1): Pos | null;
  searchWord(forward: boolean, count: number): Pos | null;
  textwidth: number;
}

function clampToChar(buf: Buffer, off: number): number {
  return Math.max(0, Math.min(off, Math.max(0, buf.flat.length - 1)));
}

/** Last non-newline offset of the buffer. */
function lastCharOffset(buf: Buffer): number {
  const flat = buf.flat;
  let i = flat.length - 1;
  while (i > 0 && flat[i] === '\n') i--;
  return i;
}

export function moveTo(buf: Buffer, p: Pos): Pos {
  const line = Math.max(0, Math.min(p.line, buf.lineCount - 1));
  const len = buf.line(line).length;
  const col = Math.max(0, Math.min(p.col, Math.max(0, len - 1)));
  return { line, col };
}

/** First non-blank column of a line (0 for blank lines). */
export function firstNonBlank(buf: Buffer, line: number): number {
  const s = buf.line(line);
  const m = /[^ \t]/.exec(s);
  return m ? m.index : 0;
}

export function lineEnd(buf: Buffer, line: number): number {
  return Math.max(0, buf.line(line).length - 1);
}

export function vertical(env: MotionEnv, delta: number): MotionResult {
  const target = Math.max(0, Math.min(env.buf.lineCount - 1, env.cursor.line + delta));
  const len = env.buf.line(target).length;
  const col = Math.max(0, Math.min(env.wantCol, Math.max(0, len - 1)));
  return { to: { line: target, col }, kind: 'linewise', lineRange: [env.cursor.line, target] };
}

export function wordMotion(env: MotionEnv, count: number, opts: { big?: boolean; dir: 1 | -1; end?: boolean }): MotionResult | null {
  const list = tokens(env.buf, opts.big);
  let off = env.buf.idx(env.cursor);
  const flat = env.buf.flat;
  if (list.length === 0) return { to: env.cursor, kind: 'exclusive' };
  for (let n = 0; n < count; n++) {
    if (!opts.end) {
      if (opts.dir === 1) {
        const t = tokenAt(list, off);
        let next: Token | undefined;
        if (t && off < t.end) {
          next = list.find((x) => x.start > off);
        } else if (t) {
          next = list.find((x) => x.start > t.start);
        } else {
          next = list.find((x) => x.start > off);
        }
        if (!next) return { to: env.buf.pos(lastCharOffset(env.buf)), kind: 'exclusive' };
        off = next.start;
      } else {
        const t = tokenAt(list, off);
        let prev: Token | undefined;
        if (t && off > t.start) prev = t;
        else {
          for (let i = list.length - 1; i >= 0; i--) {
            if (list[i].start < off) {
              prev = list[i];
              break;
            }
          }
        }
        if (!prev) return { to: { line: 0, col: 0 }, kind: 'exclusive' };
        off = prev.start;
      }
    } else {
      // e / ge
      if (opts.dir === 1) {
        const t = tokenAt(list, off);
        if (t && off < t.end) {
          off = t.end;
        } else {
          let next: Token | undefined;
          for (const x of list) if (x.start > off) { next = x; break; }
          if (!next) return { to: env.buf.pos(lastCharOffset(env.buf)), kind: 'inclusive' };
          off = next.end;
        }
      } else {
        const t = tokenAt(list, off);
        let prev: Token | undefined;
        if (t && off > t.start) {
          // inside a word: go to end of the *previous* word
          for (let i = list.length - 1; i >= 0; i--) if (list[i].end < t.start) { prev = list[i]; break; }
        } else {
          for (let i = list.length - 1; i >= 0; i--) if (list[i].end < off) { prev = list[i]; break; }
        }
        if (!prev) return { to: { line: 0, col: 0 }, kind: 'inclusive' };
        off = prev.end;
      }
    }
  }
  void flat;
  return { to: env.buf.pos(clampToChar(env.buf, off)), kind: opts.end ? 'inclusive' : 'exclusive' };
}

export function findChar(env: MotionEnv, char: string, dir: 1 | -1, till: boolean, count: number): MotionResult | null {
  const line = env.buf.line(env.cursor.line);
  let col = env.cursor.col;
  for (let n = 0; n < count; n++) {
    let found = -1;
    if (dir === 1) {
      for (let i = col + 1; i < line.length; i++) if (line[i] === char) { found = i; break; }
    } else {
      for (let i = col - 1; i >= 0; i--) if (line[i] === char) { found = i; break; }
    }
    if (found === -1) return null;
    col = found;
  }
  const dest = till ? { line: env.cursor.line, col: col - dir } : { line: env.cursor.line, col };
  const clamped = moveTo(env.buf, dest);
  if (till && clamped.col === env.cursor.col) return null;
  // Vim treats t/T as inclusive for operators (dt, deletes through the char
  // before the target) while the cursor lands on that same char.
  return { to: clamped, kind: 'inclusive' };
}

export function matchBracket(env: MotionEnv): MotionResult | null {
  const flat = env.buf.flat;
  const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', ')': '(', ']': '[', '}': '{' };
  const isOpen = (c: string) => c === '(' || c === '[' || c === '{';
  let off = env.buf.idx(env.cursor);
  // Scan forward on the current line for a bracket.
  const lineEndOff = env.buf.idx({ line: env.cursor.line, col: Math.max(0, env.buf.line(env.cursor.line).length - 1) });
  let found = -1;
  for (let i = off; i <= lineEndOff && i < flat.length; i++) {
    if (pairs[flat[i]]) { found = i; break; }
  }
  if (found === -1) {
    for (let i = lineEndOff + 1; i < flat.length; i++) if (pairs[flat[i]]) { found = i; break; }
  }
  if (found === -1) return null;
  const ch = flat[found];
  if (isOpen(ch)) {
    const close = pairs[ch];
    let depth = 0;
    for (let i = found; i < flat.length; i++) {
      if (flat[i] === ch) depth++;
      else if (flat[i] === close) {
        depth--;
        if (depth === 0) return { to: env.buf.pos(i), kind: 'inclusive', jump: true };
      }
    }
    return null;
  } else {
    const open = pairs[ch];
    let depth = 0;
    for (let i = found; i >= 0; i--) {
      if (flat[i] === ch) depth++;
      else if (flat[i] === open) {
        depth--;
        if (depth === 0) return { to: env.buf.pos(i), kind: 'inclusive', jump: true };
      }
    }
    return null;
  }
}

export function paragraphMotion(env: MotionEnv, dir: 1 | -1, count: number): MotionResult {
  const buf = env.buf;
  let line = env.cursor.line;
  const isBlank = (l: number) => buf.line(l).trim() === '';
  for (let n = 0; n < count; n++) {
    if (dir === 1) {
      if (isBlank(line) && line < buf.lineCount - 1) {
        line++;
      }
      while (line < buf.lineCount - 1 && !isBlank(line)) line++;
      while (line < buf.lineCount - 1 && isBlank(line) && line + 1 < buf.lineCount && isBlank(line + 1)) line++;
    } else {
      line--;
      while (line > 0 && isBlank(line)) line--;
      while (line > 0 && !isBlank(line - 1)) line--;
      if (isBlank(line)) line = Math.max(0, line);
    }
  }
  const target = Math.max(0, Math.min(line, buf.lineCount - 1));
  const from = env.cursor.line;
  // As an operator target, "}" stops *before* the blank line (Vim's d} keeps it).
  const range: [number, number] = dir === 1 ? [Math.min(from, target - 1), Math.max(from, target - 1)] : [target, from];
  return { to: { line: target, col: 0 }, kind: 'linewise', lineRange: [Math.min(range[0], range[1]), Math.max(range[0], range[1])] };
}

export function sentenceMotion(env: MotionEnv, dir: 1 | -1, count: number): MotionResult {
  const flat = env.buf.flat;
  let off = env.buf.idx(env.cursor);
  for (let n = 0; n < count; n++) {
    if (dir === 1) {
      let moved = false;
      for (let i = off + 1; i < flat.length; i++) {
        if (/[.!?]/.test(flat[i]) && (i + 1 >= flat.length || /[\s"'\])]/.test(flat[i + 1]))) {
          let j = i + 1;
          while (j < flat.length && /\s/.test(flat[j])) j++;
          off = Math.min(j, flat.length - 1);
          moved = true;
          break;
        }
      }
      if (!moved) off = Math.max(0, flat.length - 1);
    } else {
      // Start of the current sentence, else the previous one. A sentence ends
      // at [.!?] followed by whitespace, so scan for that, then skip the gap.
      let target = 0;
      for (let i = off - 1; i > 0; i--) {
        if (/[.!?]/.test(flat[i]) && /\s/.test(flat[i + 1] ?? ' ')) {
          let j = i + 1;
          while (j < flat.length && /\s/.test(flat[j])) j++;
          if (j < off) {
            target = j;
            break;
          }
        }
      }
      off = target;
    }
  }
  return { to: env.buf.pos(off), kind: 'exclusive', jump: true };
}

/** Greedy wrapping used by gq/gw; returns the reformatted block lines. */
export function wrapLines(lines: string[], width: number): string[] {
  const words = lines.join(' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur === '') cur = w;
    else if (cur.length + 1 + w.length <= width) cur += ' ' + w;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur !== '') out.push(cur);
  return out;
}
