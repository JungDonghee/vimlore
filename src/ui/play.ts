import { tokenize, fromKeyboardEvent, keyLabel } from '../core/vim/keys.ts';
import { Session, type SessionEvent } from '../core/game/session.ts';
import { goalLabel } from '../core/game/goals.ts';
import type { Chapter, Localized, Stage, Stars } from '../core/game/types.ts';
import { COMMAND_BY_ID } from '../content/commands.ts';
import { Renderer } from './render.ts';
import { Sfx } from './sfx.ts';
import { h, mount } from './dom.ts';

export interface PlayHost {
  sfx: Sfx;
  lang: 'ko' | 'en';
  chapter: Chapter;
  stage: Stage;
  stageIndex: number;
  stageCount: number;
  allowed: Set<string>;
  bestStars: Stars;
  bestKeys: number | null;
  crt: boolean;
  lineNumbers: 'off' | 'abs' | 'rel' | 'both';
  canSave?: boolean;
  onSave?: () => void;
  onWin(stars: Stars, keys: number, par: number): void;
  onNext(): void;
  onExit(): void;
  chapterForKey(key: string): number | null;
}

const KO = (s: Localized, lang: 'ko' | 'en'): string => (lang === 'ko' ? s.ko : s.en);

export class PlayScreen {
  private host: PlayHost;
  private root: HTMLElement;
  private session: Session;
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private board: HTMLElement;
  private echo: HTMLElement;
  private hudKeys: HTMLElement;
  private hearts: HTMLElement;
  private hintBox: HTMLElement | null = null;
  private state: 'intro' | 'playing' | 'won' | 'lost' = 'intro';
  private raf = 0;
  private lastT = 0;
  private flash = 0;
  private shake = 0;
  private hintLevel = 0;
  private ghosting = false;
  private matches: { line: number; col: number; len: number }[] = [];
  private ro: ResizeObserver | null = null;
  private destroyed = false;
  private overlay: HTMLElement | null = null;
  private dirty = true;
  private lastBlink = -1;
  private modeEl: HTMLElement | null = null;
  private posEl: HTMLElement | null = null;
  private repeatKey: string | null = null;
  private repeating = false;
  private repeatDelay = 0;
  private repeatTimer = 0;

  constructor(root: HTMLElement, host: PlayHost) {
    this.host = host;
    this.root = root;
    this.session = new Session({ stage: host.stage, chapterIndex: host.chapter.index - 1, allowed: host.allowed, onEvent: (e) => this.onEvent(e) });
    this.session.chapterForKey = host.chapterForKey;
    this.canvas = h('canvas');
    this.board = h('div', { class: 'board' }, this.canvas);
    this.echo = h('div', { class: 'echo' });
    this.hudKeys = h('span', { class: 'keys' });
    this.hearts = h('span', { class: 'hearts' });
    this.renderer = new Renderer(this.canvas);
    this.renderer.setHue(122 + ((host.chapter.index * 7) % 3) * 6);
    this.renderer.bloom = host.crt;
    this.session.vim.number = host.lineNumbers !== 'off';
    this.session.vim.relativenumber = host.lineNumbers === 'rel' || host.lineNumbers === 'both';
  }

  mount(): void {
    const { chapter, stage, lang } = this.host;
    const slug = (t: string): string =>
      t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    this.modeEl = h('span', { class: 'mode normal' }, '-- NORMAL --');
    this.posEl = h('span', { class: 'pos' }, '1,1');
    const tabline = h(
      'div',
      { class: 'tabline' },
      h('span', { class: 'path' }, `vimlore://${String(chapter.index).padStart(2, '0')}-${slug(chapter.title.en)}/${String(this.host.stageIndex + 1).padStart(2, '0')}-${slug(stage.name.en)}`),
      h(
        'span',
        { class: 'flags' },
        h('span', { class: 'mod' }, '[+]'),
        ` ${this.host.stageIndex + 1}/${this.host.stageCount}`,
        h('button', { class: 'tabclose', title: 'close buffer (F10)', onclick: () => this.host.onExit() }, '×'),
      ),
    );
    const statusline = h(
      'div',
      { class: 'statusline' },
      this.modeEl,
      this.posEl,
      h('span', { class: 'spacer' }),
      h('span', { class: 'meta' }, this.t('par', '기준')),
      this.hudKeys,
      this.hearts,
    );
    const objective = h(
      'div',
      { class: 'objective' },
      h('span', { class: 'goal' }, goalLabel(stage.goal, lang)),
      h('span', { class: 'spacer' }),
      h('button', { class: 'chip', onclick: () => this.showHint() }, lang === 'ko' ? 'TAB 힌트' : 'TAB HINT'),
      h('button', { class: 'chip', onclick: () => this.restart() }, lang === 'ko' ? 'F2 재시작' : 'F2 RETRY'),
      h('button', { class: 'chip', onclick: () => void this.playGhost() }, lang === 'ko' ? 'F3 고스트' : 'F3 GHOST'),
    );
    mount(
      this.root,
      h('div', { class: 'screen play' }, tabline, this.board, statusline, objective, h('div', { class: 'cmdline' }, this.echo)),
    );

    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(this.board);
    this.host.sfx.unlock();
    this.updateHud();
    this.fit();
    this.showIntro();
    this.loop(0);
  }

  private t(en: string, ko: string): string {
    return this.host.lang === 'ko' ? ko : en;
  }

  private fit(): void {
    this.dirty = true;
    const r = this.board.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    this.renderer.resize(r.width, r.height, this.session.vim.buf.lines);
    this.updateMatches();
  }

  private updateHud(): void {
    const s = this.session;
    const max = s.maxHearts;
    this.hearts.textContent = '';
    for (let i = 0; i < max; i++) {
      this.hearts.append(h('span', { class: i < s.hearts ? '' : 'dead' }, '♥'));
    }
    const over = s.keys > this.host.stage.par;
    this.hudKeys.className = `keys${over ? ' over' : ''}`;
    this.hudKeys.textContent = '';
    this.hudKeys.append(h('b', {}, String(s.keys)), ` / ${this.host.stage.par}`);
    this.updateStatus();
  }

  /** Classic Vim statusline: mode · position, refreshed on every keystroke. */
  private updateStatus(): void {
    if (!this.modeEl || !this.posEl) return;
    const vim = this.session.vim;
    const m = vim.mode;
    const label =
      m === 'insert' ? '-- INSERT --'
      : m === 'replace' ? '-- REPLACE --'
      : m === 'visual' ? '-- VISUAL --'
      : m === 'visual-line' ? '-- V-LINE --'
      : m === 'visual-block' ? '-- V-BLOCK --'
      : m === 'cmdline' ? ':'
      : m === 'search' ? '/'
      : '-- NORMAL --';
    const kind = m === 'insert' || m === 'replace' ? 'insert' : m === 'normal' ? 'normal' : 'visual';
    this.modeEl.textContent = label;
    this.modeEl.className = `mode ${kind}`;
    this.posEl.textContent = `${vim.cursor.line + 1},${vim.cursor.col + 1}`;
  }

  // ------------------------------------------------------------- key repeat
  //
  // OS auto-repeat is not reliable across platforms (macOS press-and-hold,
  // focus quirks, kiosk browsers), so the game runs its own repeat loop and
  // ignores `e.repeat`. 300 ms delay, then 45 ms per step — Vim-ish.

  private startRepeat(key: string): void {
    this.stopRepeat();
    if (!/^.$/u.test(key)) return;
    this.repeatKey = key;
    this.repeatDelay = window.setTimeout(() => {
      this.repeatTimer = window.setInterval(() => {
        if (this.repeatKey === null || this.state !== 'playing' || this.ghosting) {
          this.stopRepeat();
          return;
        }
        this.repeating = true;
        const ok = this.session.feed(this.repeatKey);
        this.repeating = false;
        if (!ok) {
          this.stopRepeat();
          return;
        }
        this.dirty = true;
        this.updateHud();
      }, 50);
    }, 320);
  }

  /** Called on blur / visibility change: a held key must never stick. */
  stopRepeatNow(): void {
    this.stopRepeat();
  }

  private stopRepeat(): void {
    this.repeatKey = null;
    if (this.repeatDelay) window.clearTimeout(this.repeatDelay);
    if (this.repeatTimer) window.clearInterval(this.repeatTimer);
    this.repeatDelay = 0;
    this.repeatTimer = 0;
  }

  handleKeyUp(e: KeyboardEvent): void {
    const key = fromKeyboardEvent(e);
    if (key && key === this.repeatKey) this.stopRepeat();
  }

  private updateMatches(): void {
    if (!this.session.vim.lastSearch) {
      this.matches = [];
      return;
    }
    const ms = this.session.vim.searchMatches();
    if (!ms.length) {
      this.matches = [];
      return;
    }
    this.matches = ms.slice(0, 200).map((m) => {
      const p = this.session.vim.buf.pos(m.start);
      return { line: p.line, col: p.col, len: m.end - m.start };
    });
  }

  // ------------------------------------------------------------------ events

  private onEvent(e: SessionEvent): void {
    if (this.destroyed) return;
    switch (e.type) {
      case 'key':
        if (!this.repeating) this.host.sfx.tick(this.session.vim.cursor.line);
        break;
      case 'vim':
        this.onVimEvent(e.event);
        break;
      case 'damage':
        this.flash = 1;
        this.shake = 9;
        this.host.sfx.play('hurt');
        this.updateHud();
        break;
      case 'lost':
        this.state = 'lost';
        this.showLost();
        break;
      case 'locked': {
        const ch = this.host.chapterForKey(e.key);
        const msg =
          this.host.lang === 'ko'
            ? `“${keyLabel(e.key)}” 은(는) ${ch ? `챕터 ${ch}에서` : '아직'} 열린다`
            : `“${keyLabel(e.key)}” unlocks${ch ? ` in chapter ${ch}` : ' later'}`;
        this.toast(msg, true);
        this.host.sfx.play('locked');
        break;
      }
      case 'message':
        break;
      case 'win':
        this.state = 'won';
        this.host.sfx.play('win');
        this.showResults(e.stars, e.keys, e.par);
        break;
    }
  }

  private onVimEvent(ev: { type: string; [k: string]: unknown }): void {
    this.dirty = true;
    if (ev.type === 'ex') {
      const cmd = String(ev.command ?? '').trim().toLowerCase();
      if (/^(q|q!|wq|wq!|x|x!|qa|qa!)$/.test(cmd)) {
        this.host.onExit();
        return;
      }
    }
    if (ev.type === 'change') {
      const before = String(ev.before ?? '');
      const after = String(ev.after ?? '');
      const b = before.split('\n');
      const a = after.split('\n');
      let line = 0;
      for (let i = 0; i < Math.max(b.length, a.length); i++) {
        if ((b[i] ?? '') !== (a[i] ?? '')) {
          line = i;
          break;
        }
      }
      const oldLine = b[line] ?? '';
      const newLine = a[line] ?? '';
      let col = 0;
      while (col < Math.min(oldLine.length, newLine.length) && oldLine[col] === newLine[col]) col++;
      const kind = String(ev.kind ?? '');
      const color = kind === 'delete' || kind === 'change' ? '#ef8f6a' : kind === 'put' || kind === 'insert' ? '#7ee0b4' : '#f2c14e';
      this.renderer.burst(line, Math.min(col, Math.max(0, newLine.length - 1)), 10, color);
      if (kind === 'delete' || kind === 'change') this.host.sfx.play('del');
      else if (kind === 'put' || kind === 'insert') this.host.sfx.play('ins');
      this.updateMatches();
      this.updateHud();
    }
    if (ev.type === 'yank') {
      this.host.sfx.play('yank');
      this.renderer.burst(this.session.vim.cursor.line, this.session.vim.cursor.col, 8, '#8fd0ff');
    }
    if (ev.type === 'search') {
      this.updateMatches();
      this.host.sfx.play('open');
    }
    if (ev.type === 'bell') this.host.sfx.play('locked');
  }

  // ------------------------------------------------------------------- input

  handleKey(e: KeyboardEvent): boolean {
    this.dirty = true;
    if (e.repeat) return true; // our own repeat loop handles held keys
    if (this.state === 'intro') {
      if (e.key === 'Enter') {
        this.begin();
        return true;
      }
      if (e.key === 'Escape') {
        this.host.onExit();
        return true;
      }
      return false;
    }
    if (this.state === 'won') {
      if (e.key === 'Enter') {
        this.host.onNext();
        return true;
      }
      if (e.key === 'Escape') {
        this.host.onExit();
        return true;
      }
      return true;
    }
    if (this.state === 'lost') {
      if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
        this.restart();
        return true;
      }
      if (e.key === 'Escape') {
        this.host.onExit();
        return true;
      }
      return true;
    }
    if (e.key === 'Tab') {
      this.showHint();
      return true;
    }
    if (e.key === 'F2') {
      this.restart();
      return true;
    }
    if (e.key === 'F10') {
      this.host.onExit();
      return true;
    }
    if (e.key === 'F3') {
      void this.playGhost();
      return true;
    }
    if (this.ghosting) return true;

    const key = fromKeyboardEvent(e);
    if (!key) return false;
    if (/[\uac00-\ud7af\u3131-\u318e]/.test(key)) {
      this.toast(this.host.lang === 'ko' ? '한/영 키로 영문 입력으로 바꿔 주세요' : 'Switch your input to English', true);
      return true;
    }
    this.hintBox?.remove();
    this.hintBox = null;
    const accepted = this.session.feed(key);
    this.updateHud();
    this.showEcho(key);
    if (accepted) this.startRepeat(key);
    return true;
  }

  private showEcho(key: string): void {
    const pending = this.session.vim.pendingCommand;
    const label = pending ? keyLabel(pending) : '';
    if (pending && pending.length > 0) {
      this.echo.textContent = label;
      this.echo.classList.add('on');
    } else {
      this.echo.classList.remove('on');
    }
  }

  private begin(): void {
    this.stopRepeat();
    this.state = 'playing';
    this.overlay?.remove();
    this.overlay = null;
    this.host.sfx.play('open');
    this.updateHud();
  }

  restart(): void {
    this.stopRepeat();
    this.session = this.session.restart();
    this.state = 'playing';
    this.overlay?.remove();
    this.overlay = null;
    this.hintLevel = 0;
    this.flash = 0;
    this.shake = 0;
    this.matches = [];
    this.host.sfx.play('undo');
    this.fit();
    this.updateHud();
  }

  // -------------------------------------------------------------------- loop

  private loop = (t: number): void => {
    if (this.destroyed) return;
    const dt = Math.min(64, t - this.lastT || 16);
    this.lastT = t;
    this.flash = Math.max(0, this.flash - dt / 320);
    this.shake = Math.max(0, this.shake - dt / 40);
    // Idle frames cost nothing: no keys, no particles, no flash => no draw.
    const blink = Math.floor(t / 530) % 2;
    const busy = this.dirty || this.flash > 0 || this.shake > 0 || this.renderer.busy || blink !== this.lastBlink;
    if (!busy) {
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    this.dirty = false;
    this.lastBlink = blink;
    const vim = this.session.vim;
    const sel = vim.selection();
    this.renderer.render(
      {
        lines: vim.buf.lines,
        cursor: vim.cursor,
        mode: vim.mode,
        sel: sel ? { start: sel.start, end: sel.end, linewise: !!sel.linewise, block: sel.block } : null,
        matches: this.matches,
        collected: this.session.collected,
        goalChar: '*',
        coinChar: '$',
        hazard: this.session.hazardChars,
        ghost: this.hintLevel >= 3 && this.host.stage.solution ? this.ghostHint() : null,
        flash: this.flash,
        shake: this.shake,
        numbers: this.numberMode(),
      },
      t,
    );
    this.raf = requestAnimationFrame(this.loop);
  };

  private numberMode(): 'off' | 'abs' | 'rel' | 'both' {
    const vim = this.session.vim;
    if (!vim.number && !vim.relativenumber) return 'off';
    if (vim.number && vim.relativenumber) return 'both';
    return vim.relativenumber ? 'rel' : 'abs';
  }

  private ghostHint(): { line: number; col: number; len: number } | null {
    const sol = this.host.stage.solution;
    if (!sol) return null;
    const keys = tokenize(sol);
    const n = Math.min(this.hintLevel - 3, keys.length - 1);
    if (n < 0) return null;
    return { line: this.session.vim.cursor.line, col: this.session.vim.cursor.col, len: Math.max(1, keys.length - n) };
  }

  // ----------------------------------------------------------------- overlays

  private showIntro(): void {
    const { stage, chapter, lang, stageIndex, stageCount } = this.host;
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'sigil-ghost' }, chapter.sigil),
      h('div', { class: 'eyebrow' }, `${lang === 'ko' ? '층' : 'FLOOR'} ${String(chapter.index).padStart(2, '0')} · ${KO(chapter.title, lang)} · ${stageIndex + 1}/${stageCount}`),
      h('h2', {}, KO(stage.name, lang)),
      h('div', { class: 'brief ko' }, KO(stage.brief, lang)),
      h(
        'div',
        { class: 'facts' },
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '목표' : 'TARGET'), h('div', { class: 'v' }, goalLabel(stage.goal, lang))),
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '3별 기준' : 'PAR'), h('div', { class: 'v' }, `${stage.par} ${lang === 'ko' ? '키' : 'keys'}`)),
      ),
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => this.begin() }, lang === 'ko' ? '시작' : 'BEGIN', h('kbd', {}, '↵')),
        h('button', { class: 'btn', onclick: () => this.host.onExit() }, lang === 'ko' ? '나가기' : 'LEAVE'),
      ),
    );
    this.overlay = h('div', { class: 'overlay' }, card);
    this.root.append(this.overlay);
  }

  private showResults(stars: Stars, keys: number, par: number): void {
    const { stage, lang, chapter } = this.host;
    const starEls = [0, 1, 2].map((i) => h('span', { class: i < stars ? 'on' : '' }, '★'));
    const learned = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id))
      .filter(Boolean)
      .slice(0, 4);
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'res-head' }, h('div', { class: 'eyebrow' }, lang === 'ko' ? '챔버 정화 완료' : 'CHAMBER CLEARED')),
      h('div', { class: 'stars-big' }, ...starEls),
      h(
        'div',
        { class: 'res-keys' },
        h('b', {}, String(keys)),
        lang === 'ko' ? ` 키  ·  3별 기준 ${par}` : ` keys  ·  par ${par}`,
        this.host.bestKeys !== null && this.host.bestKeys <= keys ? (lang === 'ko' ? '  ·  최고 기록' : '  ·  best') : '',
      ),
      learned.length
        ? h(
            'div',
            { class: 'learned' },
            h('div', { class: 'kicker', style: { marginBottom: '4px' } }, 'SKILL UNLOCKED'),
            ...learned.map((c) =>
              h('div', { class: 'item' }, h('code', {}, c!.keys), h('span', {}, lang === 'ko' ? c!.name.ko : c!.name.en), h('span', { style: { marginLeft: 'auto', opacity: '0.6' } }, lang === 'ko' ? c!.desc.ko : c!.desc.en)),
            ),
          )
        : null,
      h('div', { class: 'rule' }),
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => this.host.onNext() }, lang === 'ko' ? '다음' : 'NEXT', h('kbd', {}, '↵')),
        h('button', { class: 'btn', onclick: () => this.restart() }, lang === 'ko' ? '다시' : 'RETRY'),
        this.host.canSave ? h('button', { class: 'btn', onclick: () => { this.host.onSave?.(); this.host.sfx.play('yank'); } }, lang === 'ko' ? '저장' : 'SAVE') : null,
        h('button', { class: 'btn', onclick: () => this.host.onExit() }, `${lang === 'ko' ? '챕터' : 'CHAPTER'} ${String(chapter.index).padStart(2, '0')}`),
      ),
    );
    this.overlay?.remove();
    this.overlay = h('div', { class: 'overlay' }, card);
    this.root.append(this.overlay);
    this.host.onWin(stars, keys, par);
    for (let i = 0; i < stars; i++) setTimeout(() => this.host.sfx.play('star', i * 0.08), 260 + i * 220);
  }

  private showLost(): void {
    const { lang } = this.host;
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'eyebrow' }, lang === 'ko' ? '정전기에 삼켜졌다' : 'THE STATIC TOOK YOU'),
      h('h2', {}, lang === 'ko' ? '다시, 천천히' : 'Again, slower'),
      h('div', { class: 'brief ko' }, lang === 'ko' ? '정전기는 밟으면 아프다. t는 문자 앞에서 멈추고, f는 그 위에 착지한다.' : 'Static bites when you land on it. t stops before a character; f lands on it.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => this.restart() }, lang === 'ko' ? '재시작' : 'RETRY', h('kbd', {}, '↵'))),
    );
    this.overlay?.remove();
    this.overlay = h('div', { class: 'overlay' }, card);
    this.root.append(this.overlay);
  }

  private showHint(): void {
    if (this.state !== 'playing') return;
    const { stage, lang } = this.host;
    const hints = stage.hints ?? [];
    const text =
      this.hintLevel < hints.length
        ? KO(hints[this.hintLevel], lang)
        : this.hintLevel === hints.length
          ? lang === 'ko'
            ? '고스트를 보려면 F3. 정답의 손놀림을 처음부터 보여준다.'
            : 'Press F3 to watch the ghost replay the intended keys.'
          : lang === 'ko'
            ? '이미 모든 힌트를 봤다. F3으로 고스트를 봐.'
            : 'No more hints. F3 plays the ghost.';
    this.hintLevel++;
    this.hintBox?.remove();
    this.hintBox = h('div', { class: 'hint-pop ko' }, text);
    this.root.append(this.hintBox);
    this.host.sfx.play('open');
    setTimeout(() => {
      this.hintBox?.remove();
      this.hintBox = null;
    }, 7000);
  }

  async playGhost(): Promise<void> {
    if (this.ghosting || this.state !== 'playing') return;
    const sol = this.host.stage.solution;
    if (!sol) return;
    this.ghosting = true;
    this.overlay?.remove();
    this.overlay = h(
      'div',
      { class: 'overlay', style: { background: 'rgba(4,6,10,0.35)', pointerEvents: 'none' } },
      h('div', { class: 'card', style: { width: 'min(520px,90%)' } }, h('div', { class: 'eyebrow' }, 'GHOST'), h('h2', {}, this.host.lang === 'ko' ? '정답의 손' : 'The intended hand'), h('div', { class: 'brief ko' }, this.host.lang === 'ko' ? '따라 치지 말고, 손의 리듬을 봐.' : 'Do not type along. Watch the rhythm.')),
    );
    this.root.append(this.overlay);
    const keys = tokenize(sol);
    for (const k of keys) {
      if (this.destroyed) return;
      this.session.feed(k);
      this.updateHud();
      await new Promise((r) => setTimeout(r, 240));
      if (this.session.status === 'won') break;
    }
    await new Promise((r) => setTimeout(r, 700));
    this.ghosting = false;
    this.restart();
    this.toast(this.host.lang === 'ko' ? '이제 네 차례' : 'Now you', false);
  }

  private toast(msg: string, bad: boolean): void {
    const t = h('div', { class: `toast${bad ? ' locked' : ''}` }, msg);
    this.root.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  destroy(): void {
    this.stopRepeat();
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.overlay?.remove();
  }
}
