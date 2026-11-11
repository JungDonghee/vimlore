/**
 * Operator range normalization — the "Vim quirks" layer.
 *
 * Every operator (d/c/y/>/</g~/gu/gU/gq) turns a motion or text object into an
 * effective buffer range. Most of that is pure geometry, but Vim's behavior is
 * also shaped by vi-compatibility rules that are not derivable from the motion
 * alone. Those rules live here, named and documented, instead of being spread
 * through the engine's operator branches.
 *
 * The quirk registry is the contract: a new rule gets an id, a comment and
 * oracle cases before it may be added here.
 */
import type { Pos } from './types.ts';

/** Structural subset of the engine's SelRange; kept here to avoid a cycle. */
export interface SurfaceRange {
  start: Pos;
  end: Pos;
  linewise: boolean;
  block?: { c1: number; c2: number; acol?: number };
}

/** First non-blank column of a line (0 for a blank line). */
function firstNonBlankCol(text: string): number {
  const m = /[^ \t]/.exec(text);
  return m ? m.index : 0;
}

/** The Buffer surface normalization needs. */
export interface RangeBuffer {
  idx(p: Pos): number;
  pos(off: number): Pos;
  line(n: number): string;
}

export const QUIRKS = {
  /** Q02 — a charwise delete spanning lines to EOL from the indent is linewise. */
  Q02: 'delete: charwise multi-line range ending at EOL from the indent becomes linewise',
  /** Q10 — a backward range whose cursor is at column 0 is linewise above it. */
  Q10: 'backward charwise range with the cursor at column 0 operates linewise on the lines above',
} as const;

/** Convert a (start,end) pair plus inclusivity into a flat [s,e) range. */
export function flatRange(buf: RangeBuffer, r: SurfaceRange, inclusive: boolean): [number, number] {
  const a = buf.idx(r.start);
  const b = buf.idx(r.end);
  if (b >= a) {
    let end = inclusive ? b + 1 : b;
    if (!inclusive && r.end.col === 0 && r.end.line > r.start.line) end = b - 1;
    return [a, Math.max(a, end)];
  }
  const end = inclusive ? a + 1 : a;
  return [b, Math.max(b, end)];
}

/**
 * Normalize the range an operator will act on.
 *
 * `visual` disables the operator-only vi rules: a visual selection is used
 * exactly as selected (Vim does not apply the delete conversion there).
 */
export function normalizeOperatorRange(
  buf: RangeBuffer,
  opKey: string,
  r: SurfaceRange,
  inclusive: boolean,
  visual: boolean,
): SurfaceRange {
  let range = r;

  // Q10: the cursor line contributes no characters, so the operation is
  // linewise on the lines above it (`cB`/`dB`/`yB` from an empty line).
  if (
    !range.linewise &&
    !range.block &&
    !visual &&
    range.start.line > range.end.line &&
    range.start.col === 0 &&
    range.end.col === 0
  ) {
    range = { start: { line: range.end.line, col: 0 }, end: { line: range.start.line - 1, col: 0 }, linewise: true };
  }

  // Q02: vi-compatible delete conversion. `2dw`/`de` from column 0 remove
  // whole lines; the same motions from inside a word stay charwise. Change and
  // yank are deliberately excluded (Vim excludes them too).
  if (opKey === 'd' && !range.linewise && !range.block && !visual && range.start.line < range.end.line) {
    const [s, e] = flatRange(buf, range, inclusive);
    if (e > s) {
      const startPos = buf.pos(s);
      const endPos = buf.pos(e - 1);
      const tail = buf.line(endPos.line).slice(endPos.col + 1);
      if (endPos.line > startPos.line && tail.trim() === '' && startPos.col <= firstNonBlankCol(buf.line(startPos.line))) {
        range = { start: { line: startPos.line, col: 0 }, end: { line: endPos.line, col: 0 }, linewise: true };
      }
    }
  }

  return range;
}
