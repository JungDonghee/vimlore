import { Buffer } from './buffer.ts';
import type { Pos } from './types.ts';
import { tokenAt, tokens, type Token } from './wordindex.ts';

/**
 * Text objects ("i" = inner, "a" = around).
 *
 * Returned ranges are inclusive and expressed as cursor positions; the
 * operator layer converts them to buffer ranges depending on context.
 */
export interface ObjectRange {
  start: Pos;
  end: Pos;
  linewise?: boolean;
  /** Found ahead of the cursor rather than around it (Vim's `i(` fallback). */
  fallback?: boolean;
}

function blankRun(buf: Buffer, pos: Pos): ObjectRange {
  const line = buf.line(pos.line);
  let s = pos.col;
  let e = pos.col;
  while (s > 0 && (line[s - 1] === ' ' || line[s - 1] === '\t')) s--;
  while (e + 1 < line.length && (line[e + 1] === ' ' || line[e + 1] === '\t')) e++;
  return { start: { line: pos.line, col: s }, end: { line: pos.line, col: e } };
}

function wordObject(buf: Buffer, pos: Pos, around: boolean, big: boolean): ObjectRange | null {
  const flat = buf.flat;
  const off = buf.idx(pos);
  const list = tokens(buf, big);
  const t = tokenAt(list, off);
  if (!t) {
    if (!around) return blankRun(buf, pos);
    // `aw`/`aW` on whitespace: Vim selects the whitespace run plus the
    // following word (not that word's trailing whitespace).
    const next = list.find((x) => x.start > off);
    if (!next) return blankRun(buf, pos);
    const run = blankRun(buf, pos);
    return { start: run.start, end: buf.pos(next.end) };
  }
  let start = t.start;
  let end = t.end;
  if (around) {
    // Include following whitespace up to the next token (Vim does this so
    // that `daw` leaves no double space).
    let i = end + 1;
    while (i < flat.length && (flat[i] === ' ' || flat[i] === '\t')) i++;
    if (i > end + 1) end = i - 1;
    else {
      // At end of line: include preceding whitespace instead.
      let j = start - 1;
      while (j >= 0 && (flat[j] === ' ' || flat[j] === '\t')) j--;
      if (j < start - 1) start = j + 1;
    }
  }
  return { start: buf.pos(start), end: buf.pos(end) };
}

/**
 * Quote-ish objects. Finds the enclosing pair on the current line: when the
 * cursor sits on a quote, quotes pair left-to-right (0,1),(2,3),…; otherwise
 * the nearest quote on each side forms the pair (so adjacent/nested quotes work).
 */
function quoteObject(buf: Buffer, pos: Pos, around: boolean, q: string): ObjectRange | null {
  const line = buf.line(pos.line);
  const positions: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === q) positions.push(i);
  }
  if (positions.length < 2) return null;
  let pairStart = -1;
  let pairEnd = -1;
  const idx = positions.indexOf(pos.col);
  if (idx !== -1) {
    const pairIdx = idx - (idx % 2);
    pairStart = positions[pairIdx];
    pairEnd = positions[pairIdx + 1] ?? -1;
  } else {
    let prev = -1;
    let next = -1;
    for (const p of positions) {
      if (p < pos.col) prev = p;
      else if (p > pos.col) {
        next = p;
        break;
      }
    }
    if (prev !== -1 && next !== -1) {
      pairStart = prev;
      pairEnd = next;
    } else if (prev === -1 && next !== -1) {
      pairStart = positions[0];
      pairEnd = positions[1] ?? -1;
    } else {
      return null;
    }
  }
  if (pairStart === -1 || pairEnd === -1) return null;
  if (around) {
    let end = pairEnd;
    while (line[end + 1] === ' ' || line[end + 1] === '\t') end++;
    return { start: { line: pos.line, col: pairStart }, end: { line: pos.line, col: end } };
  }
  // An empty pair like "" has no inner text; Vim treats it as a no-op.
  if (pairEnd === pairStart + 1) return null;
  return { start: { line: pos.line, col: pairStart + 1 }, end: { line: pos.line, col: pairEnd - 1 } };
}

const PAIRS: Record<string, [string, string]> = {
  '(': ['(', ')'],
  ')': ['(', ')'],
  b: ['(', ')'],
  '[': ['[', ']'],
  ']': ['[', ']'],
  '{': ['{', '}'],
  '}': ['{', '}'],
  B: ['{', '}'],
  '<': ['<', '>'],
  '>': ['<', '>'],
};

function bracketObject(buf: Buffer, pos: Pos, around: boolean, openCh: string): ObjectRange | null {
  const [open, close] = PAIRS[openCh];
  const flat = buf.flat;
  const off = buf.idx(pos);
  // Scan backwards for an unmatched opening bracket. If the cursor sits on a
  // closing bracket, start just before it: that bracket is the pair's own
  // closer, not a nested one.
  let start = off;
  if (flat[off] === close) start = off - 1;
  let depth = 0;
  let startOff = -1;
  for (let i = start; i >= 0; i--) {
    const c = flat[i];
    if (c === close) depth++;
    else if (c === open) {
      if (depth === 0) {
        startOff = i;
        break;
      }
      depth--;
    }
  }
  let fallback = false;
  if (startOff === -1) {
    // Vim's bracket objects fall back to the first pair starting ahead on the
    // current line (e.g. `di(` with the cursor before the opening paren).
    const lineStart = buf.idx({ line: pos.line, col: 0 });
    const lineLen = buf.line(pos.line).length;
    for (let i = off; i < lineStart + lineLen; i++) {
      if (flat[i] === open || flat[i] === close) {
        startOff = i;
        break;
      }
    }
    if (startOff === -1) return null;
    fallback = true;
    if (flat[startOff] === close) return null;
  }
  // Scan forward for its match.
  depth = 0;
  let endOff = -1;
  for (let i = startOff; i < flat.length; i++) {
    const c = flat[i];
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        endOff = i;
        break;
      }
    }
  }
  if (endOff === -1) return null;
  if (around) return { start: buf.pos(startOff), end: buf.pos(endOff), fallback };
  const s = startOff + 1;
  let e = endOff - 1;
  // If the closing bracket starts a line, Vim's inner object ends on the last
  // character of the previous line, not on the newline before the bracket;
  // otherwise `di{` would join the closing brace onto the opening line.
  while (e > s && flat[e] === '\n') e--;
  // An empty pair like "()" has no inner text; Vim treats it as a no-op.
  if (e < s) return null;
  return { start: buf.pos(s), end: buf.pos(e), fallback };
}

function tagObject(buf: Buffer, pos: Pos, around: boolean): ObjectRange | null {
  const flat = buf.flat;
  const off = buf.idx(pos);
  const re = /<\/?([A-Za-z][A-Za-z0-9-]*)\b[^>]*>/g;
  const tags: { start: number; end: number; name: string; close: boolean }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(flat))) {
    tags.push({ start: m.index, end: m.index + m[0].length - 1, name: m[1], close: m[0][1] === '/' });
  }
  // Find the innermost tag pair enclosing the cursor.
  for (let i = tags.length - 1; i >= 0; i--) {
    const t = tags[i];
    if (t.close || t.start > off) continue;
    let depth = 0;
    for (let j = i; j < tags.length; j++) {
      const u = tags[j];
      if (u.name !== t.name) continue;
      if (!u.close) depth++;
      else {
        depth--;
        if (depth === 0) {
          if (u.start >= off) {
            if (around) return { start: buf.pos(t.start), end: buf.pos(u.end) };
            const innerStart = t.end + 1;
            const innerEnd = Math.max(t.end, u.start - 1);
            // An empty tag pair has no inner text; Vim treats it as a no-op.
            if (innerStart > innerEnd) return null;
            return { start: buf.pos(innerStart), end: buf.pos(innerEnd) };
          }
          break;
        }
      }
    }
  }
  return null;
}

function paragraphObject(buf: Buffer, pos: Pos, around: boolean): ObjectRange | null {
  const isBlank = (l: number) => buf.line(l).trim() === '';
  if (isBlank(pos.line)) {
    // On a blank line: `ip` is the blank run; `ap` is the blank run plus the
    // following paragraph (a no-op when the run already ends the buffer).
    let s = pos.line;
    let e = pos.line;
    while (s > 0 && isBlank(s - 1)) s--;
    while (e < buf.lineCount - 1 && isBlank(e + 1)) e++;
    if (around) {
      if (e >= buf.lineCount - 1) return null;
      while (e < buf.lineCount - 1 && !isBlank(e + 1)) e++;
    }
    return { start: { line: s, col: 0 }, end: { line: e, col: Math.max(0, buf.line(e).length - 1) }, linewise: true };
  }
  let s = pos.line;
  let e = pos.line;
  while (s > 0 && !isBlank(s - 1)) s--;
  while (e < buf.lineCount - 1 && !isBlank(e + 1)) e++;
  if (around) {
    while (e < buf.lineCount - 1 && isBlank(e + 1)) e++;
  }
  return { start: { line: s, col: 0 }, end: { line: e, col: Math.max(0, buf.line(e).length - 1) }, linewise: true };
}

function sentenceObject(buf: Buffer, pos: Pos, around: boolean): ObjectRange | null {
  const flat = buf.flat;
  const off = buf.idx(pos);
  let s = off;
  while (s > 0) {
    if (/[.!?]/.test(flat[s - 1]) && (s >= flat.length || /\s/.test(flat[s]))) break;
    s--;
  }
  while (s < off && /\s/.test(flat[s])) s++;
  let e = off;
  while (e < flat.length - 1) {
    if (/[.!?]/.test(flat[e]) && (e + 1 >= flat.length || /\s/.test(flat[e + 1]))) break;
    e++;
  }
  if (around) {
    while (e + 1 < flat.length && /\s/.test(flat[e + 1])) e++;
  }
  return { start: buf.pos(s), end: buf.pos(e) };
}

export function textObject(buf: Buffer, pos: Pos, around: boolean, obj: string): ObjectRange | null {
  switch (obj) {
    case 'w':
      return wordObject(buf, pos, around, false);
    case 'W':
      return wordObject(buf, pos, around, true);
    case '"':
    case "'":
    case '`':
      return quoteObject(buf, pos, around, obj);
    case '(':
    case ')':
    case 'b':
    case '[':
    case ']':
    case '{':
    case '}':
    case 'B':
    case '<':
    case '>':
      return bracketObject(buf, pos, around, obj);
    case 't':
      return tagObject(buf, pos, around);
    case 'p':
      return paragraphObject(buf, pos, around);
    case 's':
      return sentenceObject(buf, pos, around);
    default:
      return null;
  }
}

export type { Token };
