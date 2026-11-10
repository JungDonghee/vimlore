/**
 * Canvas renderer for the buffer grid.
 *
 * Performance rules (this must run on a cheap phone):
 *  - the glyph layer is cached in an offscreen canvas and only repainted when
 *    the buffer / coins / search state changes;
 *  - each frame only clears, blits, and draws cursor + particles + effects;
 *  - particles live in a preallocated array, no per-frame allocation;
 *  - no shadowBlur in the hot path (glow is faked with cheap radial sprites).
 */

export interface Cell {
  line: number;
  col: number;
}

export interface SelView {
  start: Cell;
  end: Cell;
  linewise: boolean;
  block?: { c1: number; c2: number };
}

export interface View {
  lines: string[];
  cursor: Cell;
  mode: string;
  sel: SelView | null;
  matches: { line: number; col: number; len: number }[];
  collected: Set<number>;
  goalChar: string;
  coinChar: string;
  hazard: string;
  ghost: { line: number; col: number; len: number } | null;
  flash: number;
  shake: number;
  /** gutter style: off | abs | rel | both */
  numbers: 'off' | 'abs' | 'rel' | 'both';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
}

const MAX_PARTICLES = 260;

export class Renderer {
  canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layer: HTMLCanvasElement;
  private lctx: CanvasRenderingContext2D;
  private bloomLayer: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;

  cols = 1;
  rows = 1;
  cellW = 10;
  cellH = 16;
  fontSize = 14;
  ox = 0;
  oy = 0;
  textX = 0;
  digits = 2;
  gutterCols = 4;

  private layerKey = '';
  private particles: Particle[] = [];
  private pIndex = 0;
  private alive = 0;
  private hue = 130;
  private glow: HTMLCanvasElement | null = null;
  bloom = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.layer = document.createElement('canvas');
    this.lctx = this.layer.getContext('2d')!;
    this.bloomLayer = document.createElement('canvas');
    this.bctx = this.bloomLayer.getContext('2d')!;
    this.particles = Array.from({ length: MAX_PARTICLES }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff', rot: 0 }));
  }

  setHue(hue: number): void {
    if (this.hue === hue) return;
    this.hue = hue;
    this.layerKey = '';
    this.glow = null;
  }

  resize(cssW: number, cssH: number, lines: string[]): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, Math.floor(cssW));
    this.h = Math.max(1, Math.floor(cssH));
    for (const c of [this.canvas, this.layer, this.bloomLayer]) {
      c.width = Math.floor(this.w * this.dpr);
      c.height = Math.floor(this.h * this.dpr);
    }
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.layout(lines);
    this.layerKey = '';
  }

  layout(lines: string[]): void {
    const cols = Math.max(1, ...lines.map((l) => l.length));
    const rows = Math.max(1, lines.length);
    const padX = 18;
    const padY = 14;
    const availW = this.w - padX * 2;
    const availH = this.h - padY * 2;
    this.digits = Math.max(2, String(rows).length);
    this.gutterCols = this.digits + 2; // number, gap, rule
    const totalCols = cols + this.gutterCols;
    const size = Math.min(availW / (totalCols * 0.66), availH / (rows * 1.3), 80);
    this.fontSize = Math.max(8, Math.floor(size));
    this.ctx.font = `${this.fontSize}px ${MONO}`;
    const m = this.ctx.measureText('M').width || this.fontSize * 0.62;
    this.cellW = m;
    this.cellH = Math.round(this.fontSize * 1.3);
    this.cols = cols;
    this.rows = rows;
    this.ox = Math.round((this.w - totalCols * this.cellW) / 2);
    this.textX = this.ox + this.gutterCols * this.cellW;
    this.oy = Math.round((this.h - rows * this.cellH) / 2);
  }

  private xOf(col: number): number {
    return this.textX + col * this.cellW;
  }

  private yOf(line: number): number {
    return this.oy + line * this.cellH;
  }

  private glyphColor(ch: string): string {
    if (ch === '#' || ch === '%') return '#12452a';
    if (ch === '.' || ch === ' ') return '#0d2b1a';
    if (ch === '~') return '#3f8f5e';
    if (ch === '*' || ch === '$') return '#ffc46b';
    if (/[0-9]/.test(ch)) return '#4fbf7c';
    if (/[a-zA-Z]/.test(ch)) return '#7dffa8';
    if (/[()[\]{}<>]/.test(ch)) return '#3f9a63';
    return '#2f8050';
  }

  private getGlow(): HTMLCanvasElement {
    if (this.glow) return this.glow;
    const s = 128;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,196,107,0.6)');
    grad.addColorStop(0.4, 'rgba(255,196,107,0.18)');
    grad.addColorStop(1, 'rgba(255,196,107,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    this.glow = c;
    return c;
  }

  private paintLayer(view: View): void {
    const g = this.lctx;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.font = `${this.fontSize}px ${MONO}`;

    const cx = this.cellW;
    const cy = this.cellH;

    // gutter: line numbers + a thin rule, like a real editor
    g.fillStyle = 'rgba(66,168,108,0.22)';
    g.fillRect(this.ox + (this.digits + 1.15) * cx, this.oy, 1, view.lines.length * cy);

    // the classic `~` for empty space below the buffer
    const maxRows = Math.floor((this.h - this.oy - 4) / cy);
    g.font = `${this.fontSize}px ${MONO}`;
    g.fillStyle = 'rgba(52,140,90,0.35)';
    for (let li = view.lines.length; li < Math.min(view.lines.length + 6, maxRows); li++) {
      g.fillText('~', this.textX, this.yOf(li) + cy / 2);
    }

    for (let li = 0; li < view.lines.length; li++) {
      const line = view.lines[li];
      const y = this.yOf(li) + cy / 2;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        const x = this.xOf(ci);
        if (ch === ' ') continue;
        if (ch === '.') {
          g.fillStyle = '#1a5c38';
          g.fillRect(x + cx * 0.42, y - 1, Math.max(1, cx * 0.12), Math.max(1, cx * 0.12));
          continue;
        }
        if (ch === '#' || ch === '+' || ch === '-' || ch === '|') {
          // Walls are drawn as lines and joined at their cell centres, so a
          // `+---+` frame reads as one continuous border instead of glyphs.
          const t = Math.max(1, cx * 0.08);
          const y0 = this.yOf(li);
          if (ch === '#') {
            g.fillStyle = '#17492b';
            g.fillRect(x + cx * 0.08, y0 + cy * 0.14, cx - cx * 0.16, cy - cy * 0.28);
            continue;
          }
          const above = (view.lines[li - 1] ?? '')[ci] ?? ' ';
          const below = (view.lines[li + 1] ?? '')[ci] ?? ' ';
          const left = line[ci - 1] ?? ' ';
          const right = line[ci + 1] ?? ' ';
          g.fillStyle = '#1b5c37';
          g.fillStyle = '#1b5c37';
          if (ch === '-') {
            g.fillRect(x, y0 + cy / 2 - t / 2, cx, t);
          } else if (ch === '|') {
            g.fillRect(x + cx / 2 - t / 2, y0, t, cy);
          } else {
            const l = left === '-';
            const r = right === '-';
            const u = above === '|';
            const d = below === '|';
            if (l || r) {
              const x0 = l ? x : x + cx / 2;
              const x1 = r ? x + cx : x + cx / 2;
              g.fillRect(x0, y0 + cy / 2 - t / 2, x1 - x0, t);
            }
            if (u || d) {
              const y1 = u ? y0 : y0 + cy / 2;
              const y2 = d ? y0 + cy : y0 + cy / 2;
              g.fillRect(x + cx / 2 - t / 2, y1, t, y2 - y1);
            }
          }
          continue;
        }
        if (ch === '~') {
          const px = x + cx * 0.12;
          g.strokeStyle = '#68e08d';
          g.lineWidth = Math.max(1, cy * 0.055);
          g.beginPath();
          for (let k = 0; k < 3; k++) {
            const yy = this.yOf(li) + cy * (0.32 + k * 0.18);
            const wob = ((li * 7 + ci * 3 + k) % 5) - 2;
            g.moveTo(px + wob * 0.6, yy);
            g.lineTo(px + cx * 0.72 + wob * 0.6, yy);
          }
          g.stroke();
          continue;
        }
        if (ch === '*') {
          const ccx = x + cx / 2;
          const ccy = y;
          const r = Math.min(cx, cy) * 0.42;
          const sprite = this.getGlow();
          g.drawImage(sprite, ccx - r * 2.4, ccy - r * 2.4, r * 4.8, r * 4.8);
          g.fillStyle = '#ffe6b0';
          g.beginPath();
          g.moveTo(ccx, ccy - r);
          g.quadraticCurveTo(ccx + r * 0.18, ccy - r * 0.18, ccx + r, ccy);
          g.quadraticCurveTo(ccx + r * 0.18, ccy + r * 0.18, ccx, ccy + r);
          g.quadraticCurveTo(ccx - r * 0.18, ccy + r * 0.18, ccx - r, ccy);
          g.quadraticCurveTo(ccx - r * 0.18, ccy - r * 0.18, ccx, ccy - r);
          g.fill();
          continue;
        }
        if (ch === '$') {
          const taken = view.collected.has(li * 10000 + ci);
          const ccx = x + cx / 2;
          const ccy = y;
          const r = Math.min(cx, cy) * 0.3;
          if (!taken) {
            const sprite = this.getGlow();
            g.drawImage(sprite, ccx - r * 3, ccy - r * 3, r * 6, r * 6);
          }
          g.strokeStyle = taken ? '#5a4d28' : '#f2c14e';
          g.lineWidth = Math.max(1, r * 0.34);
          g.beginPath();
          g.arc(ccx, ccy, r, 0, Math.PI * 2);
          g.stroke();
          if (!taken) {
            g.fillStyle = '#ffd98f';
            g.beginPath();
            g.arc(ccx, ccy, r * 0.28, 0, Math.PI * 2);
            g.fill();
          }
          continue;
        }
        g.fillStyle = this.glyphColor(ch);
        g.fillText(ch, x, y + this.fontSize * 0.04);
      }
    }
  }

  /** Bloom is baked once per glyph-layer change, never per frame. */
  private paintBloom(): void {
    const b = this.bctx;
    const W = this.w * this.dpr;
    const H = this.h * this.dpr;
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.clearRect(0, 0, W, H);
    b.globalCompositeOperation = 'lighter';
    b.globalAlpha = 0.16;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) b.drawImage(this.layer, dx * this.dpr, dy * this.dpr);
    b.globalAlpha = 0.07;
    b.drawImage(this.layer, -3 * this.dpr, 0);
    b.drawImage(this.layer, 3 * this.dpr, 0);
    b.globalAlpha = 1;
    b.globalCompositeOperation = 'source-over';
  }

  burst(line: number, col: number, count: number, color: string): void {
    const n = Math.min(count, 18);
    for (let i = 0; i < n; i++) {
      const p = this.particles[this.pIndex % MAX_PARTICLES];
      this.pIndex++;
      p.x = this.xOf(col) + this.cellW * 0.5 + (Math.random() - 0.5) * this.cellW;
      p.y = this.yOf(line) + this.cellH * 0.5 + (Math.random() - 0.5) * this.cellH;
      p.vx = (Math.random() - 0.5) * 0.22;
      p.vy = -Math.random() * 0.24 - 0.03;
      p.max = 420 + Math.random() * 380;
      p.life = p.max;
      p.size = Math.max(1.5, this.cellW * (0.1 + Math.random() * 0.12));
      p.color = color;
      p.rot = Math.random() * Math.PI;
      this.alive++;
    }
  }

  render(view: View, now: number): void {
    const g = this.ctx;
    const key = `${view.lines.join('\n')}|${this.hue}|${[...view.collected].join(',')}`;
    if (key !== this.layerKey) {
      this.layerKey = key;
      this.paintLayer(view);
      this.paintBloom();
    }

    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);

    const sh = view.shake;
    if (sh > 0) {
      g.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    }

    // selection
    if (view.sel) {
      g.fillStyle = `hsla(${this.hue}, 90%, 62%, 0.16)`;
      const s = view.sel;
      const l1 = Math.min(s.start.line, s.end.line);
      const l2 = Math.max(s.start.line, s.end.line);
      if (s.block) {
        const c1 = Math.min(s.block.c1, s.block.c2);
        const c2 = Math.max(s.block.c1, s.block.c2);
        for (let l = l1; l <= l2; l++) {
          g.fillRect(this.xOf(c1), this.yOf(l), (c2 - c1 + 1) * this.cellW, this.cellH);
        }
      } else if (s.linewise) {
        g.fillRect(this.xOf(0), this.yOf(l1), this.cols * this.cellW, (l2 - l1 + 1) * this.cellH);
      } else {
        for (let l = l1; l <= l2; l++) {
          const startCol = l === s.start.line ? s.start.col : 0;
          const endCol = l === s.end.line ? s.end.col + 1 : (view.lines[l] ?? '').length;
          g.fillRect(this.xOf(startCol), this.yOf(l), Math.max(1, endCol - startCol) * this.cellW, this.cellH);
        }
      }
    }

    // search matches
    if (view.matches.length) {
      g.fillStyle = 'rgba(255,196,107,0.9)';
      for (const m of view.matches) {
        const w = Math.max(1, m.len) * this.cellW;
        g.fillRect(this.xOf(m.col), this.yOf(m.line) + this.cellH - 2, w, 2);
      }
    }

    // ghost hint
    if (view.ghost) {
      const pulse = 0.35 + 0.25 * Math.sin(now / 240);
      g.strokeStyle = `rgba(255,196,107,${pulse})`;
      g.lineWidth = 1.5;
      g.strokeRect(this.xOf(view.ghost.col) - 1, this.yOf(view.ghost.line) + 1, view.ghost.len * this.cellW + 1, this.cellH - 2);
    }

    // cursorline: a faint band + a bright line number, drawn every frame
    // (the glyph layer is cached, so anything cursor-dependent must live here)
    const curLine = view.cursor.line;
    g.fillStyle = `hsla(${this.hue}, 90%, 60%, 0.055)`;
    g.fillRect(this.ox, this.yOf(curLine) + 1, this.w - this.ox * 2, this.cellH - 2);
    if (view.numbers !== 'off') {
      g.font = `${Math.max(8, Math.round(this.fontSize * 0.82))}px ${MONO}`;
      g.textAlign = 'right';
      for (let li = 0; li < view.lines.length; li++) {
        const isCur = li === curLine;
        let label: string;
        if (view.numbers === 'rel') label = String(isCur ? 0 : Math.abs(li - curLine));
        else if (view.numbers === 'both') label = String(isCur ? li + 1 : Math.abs(li - curLine));
        else label = String(li + 1);
        g.fillStyle = isCur ? 'rgba(190,255,214,0.92)' : 'rgba(66,168,108,0.42)';
        g.fillText(label, this.ox + (this.digits + 0.55) * this.cellW, this.yOf(li) + this.cellH / 2);
      }
      g.textAlign = 'left';
      g.font = `${this.fontSize}px ${MONO}`;
    }

    // glyphs
    g.drawImage(this.layer, 0, 0, this.w, this.h);

    // particles
    if (this.alive > 0) {
      for (const p of this.particles) {
        if (p.life <= 0) continue;
        p.life -= 16;
        if (p.life <= 0) this.alive--;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.004;
        const a = Math.max(0, p.life / p.max);
        g.globalAlpha = a;
        g.fillStyle = p.color;
        g.fillRect(p.x, p.y, p.size, p.size);
        void p.rot;
        if (p.life <= 0) g.globalAlpha = 1;
      }
      g.globalAlpha = 1;
    }

    // cursor: a block that blinks like a terminal, an underline while inserting
    const { line, col } = view.cursor;
    const cx = this.xOf(col);
    const cy = this.yOf(line);
    const insert = view.mode === 'insert' || view.mode === 'replace';
    const blinkOn = (now % 1060) < 820 || insert;
    if (insert) {
      g.fillStyle = `hsla(${this.hue}, 95%, 64%, ${blinkOn ? 0.95 : 0.4})`;
      g.fillRect(cx, cy + this.cellH - Math.max(2, this.cellH * 0.07), this.cellW, Math.max(2, this.cellH * 0.07));
    } else if (blinkOn) {
      g.fillStyle = `hsla(${this.hue}, 95%, 66%, 0.92)`;
      g.fillRect(cx, cy + 1, this.cellW + 1, this.cellH - 2);
      const ch = (view.lines[line] ?? '')[col] ?? ' ';
      if (ch !== ' ' && ch !== '.' && ch !== '#' && ch !== '|' && ch !== '-') {
        g.fillStyle = '#04140a';
        g.font = `${this.fontSize}px ${MONO}`;
        g.textBaseline = 'middle';
        g.fillText(ch, cx, cy + this.cellH / 2 + this.fontSize * 0.04);
      }
    } else {
      g.strokeStyle = `hsla(${this.hue}, 95%, 66%, 0.45)`;
      g.lineWidth = 1;
      g.strokeRect(cx + 0.5, cy + 1.5, this.cellW, this.cellH - 3);
    }

    // phosphor bloom: one pre-baked additive layer
    if (this.bloom) {
      g.globalCompositeOperation = 'lighter';
      g.drawImage(this.bloomLayer, 0, 0, this.w, this.h);
      g.globalCompositeOperation = 'source-over';
    }

    // damage flash
    if (view.flash > 0) {
      g.fillStyle = `rgba(255,80,70,${Math.min(0.26, view.flash * 0.26)})`;
      g.fillRect(-40, -40, this.w + 80, this.h + 80);
    }
  }

  get busy(): boolean {
    return this.alive > 0;
  }

  private roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
