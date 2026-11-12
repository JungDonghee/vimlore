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
  const raw = env.cursor.line + delta;
  const target = Math.max(0, Math.min(env.buf.lineCount - 1, raw));
  const len = env.buf.line(target).length;
  const col = Math.max(0, Math.min(env.wantCol, Math.max(0, len - 1)));
  // A count that crosses BOF/EOF clamps when at least one line of movement is
  // possible (`3k` from line 3 lands on line 1), but fails when the cursor is
  // already at the boundary (`j` on the last line cancels `dj`).
  const atBoundary = delta > 0 ? env.cursor.line >= env.buf.lineCount - 1 : env.cursor.line <= 0;
  if ((raw < 0 || raw > env.buf.lineCount - 1) && atBoundary) {
    return { to: { ...env.cursor }, kind: 'linewise', lineRange: [env.cursor.line, env.cursor.line], failed: true };
  }
  return { to: { line: target, col }, kind: 'linewise', lineRange: [env.cursor.line, target] };
}

export function wordMotion(env: MotionEnv, count: number, opts: { big?: boolean; dir: 1 | -1; end?: boolean }): MotionResult | null {
  const list = tokens(env.buf, opts.big);
  let off = env.buf.idx(env.cursor);
  const startOff = off;
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
        if (!next) {
          // Exclusive endpoint must be one past the last char, so an operator
          // like `d2w` deletes the final word instead of leaving its last char.
          const lastLine = env.buf.lineCount - 1;
          return { to: { line: lastLine, col: env.buf.line(lastLine).length }, kind: 'exclusive' };
        }
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
        if (!prev) {
          // `b`/`B` past the first word lands on column 0. If the cursor was
          // already at 0,0 nothing moved and an operator is cancelled; a count
          // that runs out after a step keeps the progress.
          const atBof = env.cursor.line === 0 && env.cursor.col === 0;
          return { to: { line: 0, col: 0 }, kind: 'exclusive', failed: off === startOff && atBof };
        }
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
          for (const x of list) if (x.start > off && !x.blank) { next = x; break; }
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
  // Forward f/t is inclusive for operators even when the target is adjacent:
  // `dt(` on "a(b" deletes the `a`. Backward F/T ranges end just before the
  // original cursor, so the cursor character itself is not consumed.
  return { to: clamped, kind: dir === 1 ? 'inclusive' : 'exclusive' };
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

export function paragraphMotion(env: MotionEnv, dir: 1 | -1, count: number): MotionResult | null {
  const buf = env.buf;
  const last = buf.lineCount - 1;
  const isBlank = (l: number) => buf.line(l).trim() === '';
  const startedBlank = isBlank(env.cursor.line);
  let line = env.cursor.line;
  for (let n = 0; n < count; n++) {
    const before = line;
    if (dir === 1) {
      // From a blank line, skip the blank run first, then the paragraph,
      // landing on the first blank line of the next run (or EOF).
      if (isBlank(line) && line < last) {
        while (line < last && isBlank(line)) line++;
      }
      while (line < last && !isBlank(line)) line++;
    } else {
      // From a blank line, skip the blank run upward, then the paragraph,
      // landing on the blank line above it (or BOF).
      if (isBlank(line)) {
        while (line > 0 && isBlank(line)) line--;
      }
      while (line > 0 && !isBlank(line - 1)) line--;
      if (line > 0) line--;
    }
    if (line === before) {
      // A counted motion fails (no-op) when a step has nowhere to move. A
      // single uncounted motion still moves: `{` goes to column 0 at BOF and
      // `}` goes to the last character at EOF.
      if (n === 0 && count === 1) {
        if (dir === 1) {
          const to = { line: last, col: Math.max(0, buf.line(last).length - 1) };
          if (buf.flat === '') return null;
          return { to, kind: 'inclusive' };
        } else if (env.cursor.col > 0) {
          return { to: { line: 0, col: 0 }, kind: 'exclusive' };
        }
      }
      return null;
    }
  }
  const fromLine = env.cursor.line;
  const fromCol = env.cursor.col;
  if (dir === 1) {
    if (line === last && !isBlank(last)) {
      // Ran through the final paragraph to EOF: Vim lands on the last character
      // and an operator runs to it inclusively. This also holds when the motion
      // started on a blank line (`}` from the separator before the last one).
      return { to: { line: last, col: Math.max(0, buf.line(last).length - 1) }, kind: 'inclusive' };
    }
    const to = { line, col: 0 };
    // `d}` from column 0 takes whole lines (the exclusive endpoint at column 0
    // is moved back to the end of the previous line, which is linewise here).
    if (fromCol === 0 && line > fromLine) return { to, kind: 'linewise', lineRange: [fromLine, line - 1] };
    return { to, kind: 'exclusive' };
  }
  const to = { line, col: 0 };
  if (fromCol === 0 && line < fromLine) return { to, kind: 'linewise', lineRange: [line, fromLine - 1] };
  return { to, kind: 'exclusive' };
}

export function sentenceMotion(env: MotionEnv, dir: 1 | -1, count: number): MotionResult | null {
  const buf = env.buf;
  const flat = buf.flat;
  let off = buf.idx(env.cursor);
  if (dir === -1) {
    // Backward: Vim's `(` lands on the previous *sentence start*. A sentence
    // start is BOF, the last blank line of a blank run, the first non-blank of
    // a paragraph, or the first non-blank after `[.!?]` + whitespace.
    const starts: number[] = [0];
    const push = (n: number) => {
      if (n >= 0 && n < flat.length) starts.push(n);
    };
    const blank = (l: number) => buf.line(l).trim() === '';
    for (let l = 0; l < buf.lineCount; l++) {
      if (!blank(l)) continue;
      if (l + 1 < buf.lineCount && blank(l + 1)) continue;
      push(buf.idx({ line: l, col: 0 }));
    }
    for (let l = 0; l < buf.lineCount; l++) {
      if (blank(l)) continue;
      if (l > 0 && blank(l - 1)) push(lineFirstNonBlank(buf, l));
    }
    for (let i = 0; i < flat.length; i++) {
      if (!/[.!?]/.test(flat[i])) continue;
      let j = i + 1;
      while (j < flat.length && /["')\]]/.test(flat[j])) j++;
      if (j >= flat.length || !/\s/.test(flat[j])) continue;
      while (j < flat.length && /\s/.test(flat[j])) j++;
      if (j < flat.length) push(j);
    }
    const uniq = [...new Set(starts)].sort((a, b) => a - b);
    const startOff = off;
    let target = off;
    for (let n = 0; n < count; n++) {
      let best = -1;
      for (const s of uniq) {
        if (s < target) best = s;
        else break;
      }
      // A single uncounted `(` that cannot move is a zero-length motion:
      // `c(` still opens insert and `d(` is a no-op. A counted one that runs
      // out cancels the operator (`2d(` at BOF).
      if (best < 0) {
        if (count === 1) return { to: buf.pos(startOff), kind: 'exclusive' };
        return { to: buf.pos(startOff), kind: 'exclusive', failed: true };
      }
      target = best;
    }
    return { to: buf.pos(target), kind: 'exclusive', jump: true };
  }
  let hitEof = false;
  for (let n = 0; n < count; n++) {
    // If we are on a blank separator line, skip the blank run first, then the
    // paragraph, landing on the first blank line of the next run (or EOF).
    const blankLine = buf.pos(off).line;
    if (buf.line(blankLine).trim() === '' && blankLine < buf.lineCount - 1) {
      let l = blankLine + 1;
      while (l < buf.lineCount - 1 && buf.line(l).trim() === '') l++;
      off = buf.idx({ line: l, col: 0 });
      continue;
    }
    let moved = false;
    for (let i = off + 1; i < flat.length; i++) {
      // A blank line starts a new sentence in Vim: `)` stops there.
      if (flat[i] === '\n' && i + 1 < flat.length && flat[i + 1] === '\n' && i + 1 !== off) {
        off = i + 1;
        moved = true;
        break;
      }
      if (/[.!?]/.test(flat[i]) && (i + 1 >= flat.length || /[\s"'\])]/.test(flat[i + 1]))) {
        let j = i + 1;
        while (j < flat.length && /\s/.test(flat[j])) j++;
        off = Math.min(j, flat.length - 1);
        moved = true;
        break;
      }
    }
    if (!moved) {
      // Count 1 reaching EOF is success (`d)` deletes to the end). A counted
      // `)` that hits EOF before its last step fails (`2d)` on the last
      // sentence is a no-op).
      if (n < count - 1) return { to: { ...env.cursor }, kind: 'exclusive', failed: true };
      off = Math.max(0, flat.length - 1);
      hitEof = true;
    }
  }
  return { to: buf.pos(off), kind: hitEof ? 'inclusive' : 'exclusive', jump: true };
}

/** First non-blank offset of a line. */
function lineFirstNonBlank(buf: Buffer, line: number): number {
  const start = buf.idx({ line, col: 0 });
  const text = buf.line(line);
  const m = /[^ \t]/.exec(text);
  return start + (m ? m.index : 0);
}

/** Greedy wrapping used by gq/gw; returns the reformatted block lines. */
export function wrapLines(lines: string[], width: number): string[] {
  // Vim's formatter preserves runs of spaces (including the two spaces after
  // sentence punctuation) rather than collapsing them. Join source line breaks
  // with one space, but keep in-line whitespace exactly.
  const text = lines.join(' ').replace(/^[ \t]+|[ \t]+$/g, '');
  if (!text) return [''];
  const tokens = text.match(/\S+| +/g) ?? [];
  const out: string[] = [];
  let cur = '';
  for (const tok of tokens) {
    if (/^ +$/.test(tok)) {
      cur += tok;
      continue;
    }
    if (cur === '') cur = tok;
    else if (cur.length + tok.length <= width) cur += tok;
    else {
      out.push(cur.replace(/ +$/, ''));
      cur = tok;
    }
  }
  if (cur !== '') out.push(cur.replace(/ +$/, ''));
  return out;
}
