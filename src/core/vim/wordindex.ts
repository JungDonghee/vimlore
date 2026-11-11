import { Buffer } from './buffer.ts';

/**
 * Token index over a buffer.
 *
 * Vim's word motions are defined in terms of keyword characters
 * (letters/digits/underscore) vs punctuation vs blanks. Instead of walking
 * character by character on every keypress we build a token list once per
 * buffer revision and binary-search it.
 */
export interface Token {
  start: number; // flat offset, inclusive
  end: number; // flat offset, inclusive
  /** An empty line: Vim's word motions stop on it, but `e`/`E` skip it. */
  blank?: boolean;
}

interface Index {
  version: number;
  word: Token[];
  big: Token[];
}

const CACHE = new WeakMap<Buffer, Index>();

export function charClass(ch: string): 0 | 1 | 2 {
  if (ch === '' || ch === ' ' || ch === '\t' || ch === '\n') return 0;
  // Non-ASCII glyphs (✧ ♥ ◈) are the game's "words", so treat them as keyword chars.
  if (ch.charCodeAt(0) > 0x7f) return 1;
  if (/[A-Za-z0-9_]/.test(ch)) return 1;
  return 2;
}

function buildIndex(buf: Buffer): Index {
  const cached = CACHE.get(buf);
  if (cached && cached.version === buf.version) return cached;
  const flat = buf.flat;
  const word: Token[] = [];
  const big: Token[] = [];
  let i = 0;
  while (i < flat.length) {
    const c = flat[i];
    if (c === '\n') {
      // An empty line is a word-motion stop in Vim (w/W/b/B/ge land on it).
      if (i === 0 || flat[i - 1] === '\n') {
        const blank: Token = { start: i, end: i, blank: true };
        word.push(blank);
        big.push(blank);
      }
      i++;
      continue;
    }
    const k = charClass(c);
    if (k === 0) {
      i++;
      continue;
    }
    const start = i;
    while (i + 1 < flat.length && flat[i + 1] !== '\n' && charClass(flat[i + 1]) === k) i++;
    const end = i;
    word.push({ start, end });
    let bs = start;
    while (bs > 0 && flat[bs - 1] !== '\n' && charClass(flat[bs - 1]) !== 0) bs--;
    let be = end;
    while (be + 1 < flat.length && flat[be + 1] !== '\n' && charClass(flat[be + 1]) !== 0) be++;
    if (bs === start) big.push({ start, end: be });
    i = end + 1;
  }
  const idx = { version: buf.version, word, big };
  CACHE.set(buf, idx);
  return idx;
}

export function tokens(buf: Buffer, big = false): Token[] {
  return big ? buildIndex(buf).big : buildIndex(buf).word;
}

/** Token containing offset (inclusive start..end), or null on blanks. */
export function tokenAt(list: Token[], off: number): Token | null {
  let lo = 0;
  let hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = list[mid];
    if (off < t.start) hi = mid - 1;
    else if (off > t.end) lo = mid + 1;
    else return t;
  }
  return null;
}
