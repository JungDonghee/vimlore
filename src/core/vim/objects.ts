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
    return blankRun(buf, pos);
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
 * Quote-ish objects. Finds the enclosing pair on the current line by
 * pairing delimiters left-to-right (Vim's heuristic for simple text).
 */
function quoteObject(buf: Buffer, pos: Pos, around: boolean, q: string): ObjectRange | null {
  const line = buf.line(pos.line);
  const close = q === '`' ? '`' : q;
  const positions: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === q) positions.push(i);
  }
  if (positions.length < 2) return null;
  let pairStart = -1;
  let pairEnd = -1;
  for (let i = 0; i + 1 < positions.length; i += 2) {
    if (pos.col <= positions[i + 1] && pos.col >= positions[i]) {
      pairStart = positions[i];
      pairEnd = positions[i + 1];
      break;
    }
  }
  if (pairStart === -1) {
    // Cursor is on the opening quote of the next pair.
    for (let i = 0; i + 1 < positions.length; i += 2) {
      if (pos.col === positions[i]) {
        pairStart = positions[i];
        pairEnd = positions[i + 1];
        break;
      }
    }
  }
  if (pairStart === -1) return null;
  void close;
  if (around) {
    let end = pairEnd;
    if (line[end + 1] === ' ' || line[end + 1] === '\t') end++;
    return { start: { line: pos.line, col: pairStart }, end: { line: pos.line, col: end } };
  }
  if (pairEnd === pairStart + 1) {
    return { start: { line: pos.line, col: pairStart + 1 }, end: { line: pos.line, col: pairEnd - 1 } };
  }
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
  // Scan backwards for an unmatched opening bracket.
  let depth = 0;
  let startOff = -1;
  for (let i = off; i >= 0; i--) {
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
  if (startOff === -1) return null;
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
  if (around) return { start: buf.pos(startOff), end: buf.pos(endOff) };
  const s = startOff + 1;
  const e = endOff - 1;
  if (e < s) return { start: buf.pos(startOff + 1), end: buf.pos(startOff) };
  return { start: buf.pos(s), end: buf.pos(e) };
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
            return { start: buf.pos(t.end + 1), end: buf.pos(Math.max(t.end, u.start - 1)) };
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
  if (isBlank(pos.line)) return null;
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
