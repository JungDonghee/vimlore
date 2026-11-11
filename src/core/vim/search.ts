import type { Pos } from './types.ts';

/**
 * Vim-ish pattern translation + matching.
 *
 * Vim's default "magic" mode is not JavaScript regex: bare ( ) | + ? { are
 * literal, while \( \) \| \+ \? \{ opt in. We translate to JS regex and use
 * `smartcase` (all-lowercase pattern => case-insensitive), which matches what
 * modern Vim users expect (and the game's settings).
 */

export interface SearchOptions {
  ignoreCase?: boolean;
  smartcase?: boolean;
}

function translateCore(pat: string, opts: SearchOptions): { source: string; flags: string } {
  let src = pat;
  let veryMagic = false;
  if (src.startsWith('\\v')) {
    veryMagic = true;
    src = src.slice(2);
  } else if (src.startsWith('\\V')) {
    src = src.slice(2);
    src = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    veryMagic = false;
  } else if (src.startsWith('\\m')) {
    src = src.slice(2);
  } else if (src.startsWith('\\M')) {
    src = src.slice(2);
    src = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // `\c` / `\C` toggle case sensitivity for the whole pattern and may appear
  // anywhere (Vim semantics), unlike the leading magic-mode prefixes above.
  let caseFlag: 'i' | 's' | '' = '';
  {
    let out = '';
    for (let i = 0; i < src.length; i++) {
      if (src[i] === '\\' && (src[i + 1] === 'c' || src[i + 1] === 'C')) {
        let run = 1;
        for (let j = i - 1; j >= 0 && src[j] === '\\'; j--) run++;
        if (run % 2 === 1) {
          caseFlag = src[i + 1] === 'c' ? 'i' : 's';
          i++;
          continue;
        }
      }
      out += src[i];
    }
    src = out;
  }

  let out = '';
  if (veryMagic) {
    out = src;
  } else {
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === '\\') {
        const n = src[i + 1];
        if (n === undefined) {
          out += '\\\\';
          break;
        }
        i++;
        switch (n) {
          case '(':
          case ')':
          case '|':
          case '+':
          case '?':
          case '{':
          case '}':
            out += n;
            break;
          case '<':
          case '>':
            out += '\\b';
            break;
          case 'n':
            out += '\\n';
            break;
          case 't':
            out += '\\t';
            break;
          case 'd':
          case 'D':
          case 's':
          case 'S':
          case 'w':
          case 'W':
          case 'a':
          case 'A':
            out += '\\' + n;
            break;
          case '/':
            out += '/';
            break;
          default:
            out += '\\' + n;
        }
      } else if ('()|+?{}'.includes(c)) {
        out += '\\' + c;
      } else if (c === '~') {
        out += '~';
      } else {
        out += c;
      }
    }
  }

  const hasUpper = /[A-Z]/.test(src);
  const ignore = caseFlag === 'i' ? true : caseFlag === 's' ? false : opts.smartcase ? !hasUpper : !!opts.ignoreCase;
  let flags = 'g';
  if (ignore) flags += 'i';
  return { source: out, flags };
}

/**
 * `\zs` / `\ze` set the match start/end inside the pattern. Split the raw
 * pattern and express the offsets with a JS lookbehind/lookahead around the
 * translated middle segment. This covers the common `foo \zsbar` and
 * `foo\ze bar` forms used by teaching material and by :s.
 */
function translate(pat: string, opts: SearchOptions): { source: string; flags: string } {
  const zs = pat.indexOf('\\zs');
  const ze = pat.indexOf('\\ze');
  if (zs < 0 && ze < 0) return translateCore(pat, opts);
  let head = '';
  let mid = '';
  let tail = '';
  if (zs >= 0 && (ze < 0 || zs < ze)) {
    head = pat.slice(0, zs);
    if (ze >= 0) {
      mid = pat.slice(zs + 3, ze);
      tail = pat.slice(ze + 3);
    } else {
      mid = pat.slice(zs + 3);
    }
  } else if (ze >= 0) {
    mid = pat.slice(0, ze);
    tail = pat.slice(ze + 3);
  }
  const h = head ? translateCore(head, opts) : null;
  const m = translateCore(mid, opts);
  const t = tail ? translateCore(tail, opts) : null;
  let source = '';
  if (h) source += `(?<=${h.source})`;
  source += m.source;
  if (t) source += `(?=${t.source})`;
  const ignore = [h, m, t].some((x) => x?.flags.includes('i'));
  return { source, flags: ignore ? 'gi' : 'g' };
}

export interface Match {
  start: number; // flat offset
  end: number; // flat offset, exclusive
  text: string;
}

export function compilePattern(pat: string, opts: SearchOptions = {}): RegExp | null {
  try {
    const { source, flags } = translate(pat, opts);
    return new RegExp(source, flags);
  } catch {
    return null;
  }
}

/** All matches in `text`, in order. */
export function allMatches(text: string, re: RegExp): Match[] {
  const out: Match[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(text))) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    if (m[0].length === 0) re.lastIndex++;
    if (++guard > 10000) break;
  }
  return out;
}

export function matchToPos(buf: { pos(off: number): Pos }, m: Match): { start: Pos; end: Pos } {
  return { start: buf.pos(m.start), end: buf.pos(Math.max(m.start, m.end - 1)) };
}

/** Wrap-aware pick of the count-th match from `from` in direction `dir`. */
export function pickMatch(matches: Match[], fromOffset: number, dir: 1 | -1, count: number): Match | null {
  if (matches.length === 0) return null;
  let idx = -1;
  if (dir === 1) {
    idx = matches.findIndex((m) => m.start > fromOffset);
    if (idx === -1) idx = 0;
    idx = (idx + (count - 1)) % matches.length;
  } else {
    for (let i = matches.length - 1; i >= 0; i--) {
      if (matches[i].start < fromOffset) {
        idx = i;
        break;
      }
    }
    if (idx === -1) idx = matches.length - 1;
    idx = ((idx - (count - 1)) % matches.length + matches.length) % matches.length;
  }
  return matches[idx];
}
