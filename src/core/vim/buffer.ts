import type { Pos } from './types.ts';

/**
 * Text buffer with a cached flat representation.
 *
 * The flat string joins lines with "\n" and a parallel index table maps
 * (line, col) <-> flat offset. Word motions then become simple scans, which
 * is both simpler to reason about and faster than nested loop walking.
 *
 * The buffer is intentionally small (game levels are <= ~100x40). Edits are
 * string replacements; caching is invalidated on every mutation.
 */
export class Buffer {
  lines: string[];
  /** Monotonic revision counter; bumped on every mutation. */
  version = 0;
  private flatCache: string | null = null;
  private startCache: number[] | null = null;

  constructor(text: string | string[]) {
    this.lines = Array.isArray(text) ? text.slice() : text.split('\n');
    if (this.lines.length === 0) this.lines = [''];
  }

  get lineCount(): number {
    return this.lines.length;
  }

  line(n: number): string {
    return this.lines[n] ?? '';
  }

  get flat(): string {
    if (this.flatCache === null) {
      this.flatCache = this.lines.join('\n');
      const starts: number[] = new Array(this.lines.length);
      let off = 0;
      for (let i = 0; i < this.lines.length; i++) {
        starts[i] = off;
        off += this.lines[i].length + 1;
      }
      this.startCache = starts;
    }
    return this.flatCache;
  }

  /** Line-start offsets in flat coordinates. */
  get lineStarts(): number[] {
    if (this.startCache === null) void this.flat;
    return this.startCache!;
  }

  /** Flat offset of a position. */
  idx(p: Pos): number {
    const starts = this.lineStarts;
    const base = starts[Math.max(0, Math.min(p.line, starts.length - 1))] ?? 0;
    return base + Math.max(0, Math.min(p.col, this.line(p.line).length));
  }

  /** Position of a flat offset. Out-of-range offsets clamp to the last char. */
  pos(offset: number): Pos {
    const flat = this.flat;
    let i = Math.max(0, Math.min(offset, flat.length));
    const starts = this.lineStarts;
    // Binary search over line starts.
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= i) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo, col: i - starts[lo] };
  }

  private dirty(): void {
    this.version++;
    this.flatCache = null;
    this.startCache = null;
  }

  setLines(lines: string[]): void {
    this.lines = lines.length ? lines : [''];
    this.dirty();
  }

  setLine(n: number, text: string): void {
    this.lines[n] = text;
    this.dirty();
  }

  insertLine(n: number, text: string): void {
    this.lines.splice(n, 0, text);
    this.dirty();
  }

  removeLine(n: number): void {
    this.lines.splice(n, 1);
    if (this.lines.length === 0) this.lines.push('');
    this.dirty();
  }

  /** Replace an arbitrary flat range. */
  replaceFlat(from: number, to: number, text: string): void {
    const flat = this.flat;
    const next = flat.slice(0, from) + text + flat.slice(to);
    this.lines = next.split('\n');
    if (this.lines.length === 0) this.lines = [''];
    this.dirty();
  }

  clone(): Buffer {
    return new Buffer(this.lines);
  }

  toString(): string {
    return this.flat;
  }
}
