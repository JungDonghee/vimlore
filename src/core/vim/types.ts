/**
 * Shared types for the Vim engine.
 *
 * Positions are always 0-based: `line` indexes Buffer.lines, `col` indexes
 * UTF-16 code units within a line (see buffer.ts for the wide-char caveat).
 */

export interface Pos {
  line: number;
  col: number;
}

export type Mode =
  | 'normal'
  | 'insert'
  | 'replace'
  | 'visual'
  | 'visual-line'
  | 'visual-block'
  | 'cmdline'
  | 'search';

export const MODE_NAMES: Record<Mode, string> = {
  normal: 'NORMAL',
  insert: 'INSERT',
  replace: 'REPLACE',
  visual: 'VISUAL',
  'visual-line': 'V-LINE',
  'visual-block': 'V-BLOCK',
  cmdline: 'COMMAND',
  search: 'SEARCH',
};

/** How a motion's endpoint should be interpreted by an operator. */
export type MotionKind = 'exclusive' | 'inclusive' | 'linewise';

export interface MotionResult {
  /** The motion could not move the requested count (Vim beeps); operators cancel. */
  failed?: boolean;
  /** Destination position (where the cursor lands when the motion is used alone). */
  to: Pos;
  kind: MotionKind;
  /** True for motions that push a jumplist entry (gg, G, /, %, ...). */
  jump?: boolean;
  /** For linewise motions an explicit line range can be given. */
  lineRange?: [number, number];
  /** Search motions include the line break when the match is at column 0. */
  noBolAdjust?: boolean;
}

export interface Register {
  text: string;
  linewise: boolean;
  /** True when the register holds a visual-block selection (paste column-wise). */
  blockwise?: boolean;
}

export interface BufferSnapshot {
  lines: string[];
  cursor: Pos;
  /** Cursor Vim leaves after undoing this change (linewise delete/change). */
  undoCursor?: Pos;
}

export const isBlank = (ch: string): boolean => ch === ' ' || ch === '\t' || ch === '';
