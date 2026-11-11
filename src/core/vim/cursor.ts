/**
 * Cursor policy — the Q04/Q09 quirks layer.
 *
 * The operator layer decides *which text* a command changes; this module
 * decides *where the cursor lands afterwards*. Vim's rules here are not
 * derivable from the range alone: they depend on the motion, on whether the
 * operator was doubled/visual/a text object, and on whether the cursor started
 * inside the range. They are named and tested so the engine keeps only the
 * effect dispatch.
 *
 * Q04 — zero-range case motions:
 *   `g~0`/`gU0`/`g~^`/`gU^`/`g~h`/`gUh` at column 0 of a non-first line are
 *   linewise on the current line; on line 1 they toggle the single character.
 *   A zero-range `^` at the first non-blank of an indented line is a no-op.
 *
 * Q09 — case-operator cursor:
 *   visual selections land on the start line; text objects start at column 0;
 *   a single linewise line uses min(cursor.col, first-non-blank); doubled
 *   operators keep the cursor; a backward linewise motion keeps the motion's
 *   landing column; otherwise the original column is retained.
 */
import type { Buffer } from './buffer.ts';
import type { Pos } from './types.ts';
import { firstNonBlank, moveTo } from './motions.ts';

/** What a zero-range case motion should do (Q04). */
export type ZeroRangeCaseAction = 'linewise' | 'noop' | null;

const CASE_OPS = new Set(['gU', 'gu', 'g~']);

export function zeroRangeCaseAction(
  opKey: string,
  motionKey: string,
  from: Pos,
  to: Pos,
): ZeroRangeCaseAction {
  if (!CASE_OPS.has(opKey)) return null;
  if (to.line !== from.line || to.col !== from.col) return null;
  if (motionKey === '0' || motionKey === 'h') {
    return from.col === 0 && from.line > 0 ? 'linewise' : null;
  }
  if (motionKey === '^') {
    if (from.col === 0) return from.line > 0 ? 'linewise' : null;
    return 'noop';
  }
  return null;
}

export interface CaseCursorContext {
  buf: Buffer;
  /** Cursor position before the operator ran. */
  cursor: Pos;
  /** Operator range (linewise ranges use start/end lines only). */
  start: Pos;
  end: Pos;
  visual: boolean;
  doubled: boolean;
  fromTextObject: boolean;
  motionFrom: Pos | null;
  motionTo: Pos | null;
}

/** Cursor after a linewise case change (Q09). */
export function caseOperatorCursor(c: CaseCursorContext): Pos {
  const l1 = Math.min(c.start.line, c.end.line);
  const l2 = Math.max(c.start.line, c.end.line);

  if (c.visual) {
    if (l1 === l2) return { line: l1, col: 0 };
    if (c.cursor.line === l1) return moveTo(c.buf, { line: l1, col: c.cursor.col });
    return { line: l1, col: 0 };
  }
  if (c.fromTextObject) return { line: l1, col: 0 };
  if (l1 === l2) {
    // Single-line linewise case: first non-blank, but a cursor already inside
    // the indent keeps its column (Vim does not move right).
    const fnb = firstNonBlank(c.buf, l1);
    return c.cursor.col < fnb ? { line: l1, col: c.cursor.col } : { line: l1, col: fnb };
  }
  if (c.doubled) return moveTo(c.buf, c.cursor);
  if (c.motionFrom && c.motionTo && c.motionTo.line < c.motionFrom.line) {
    // Backward linewise case: Vim leaves the cursor where the motion landed.
    // `gg` lands on the first non-blank, `k` keeps the column.
    return moveTo(c.buf, { line: l1, col: c.motionTo.col });
  }
  return moveTo(c.buf, { line: l1, col: c.cursor.col });
}
