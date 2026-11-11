import { tokenize, fromKeyboardEvent, keyLabel } from '../core/vim/keys.ts';
import { Session, type SessionEvent } from '../core/game/session.ts';
import { goalLabel } from '../core/game/goals.ts';
import type { Chapter, Goal, Localized, Stage, Stars } from '../core/game/types.ts';
import { COMMAND_BY_ID } from '../content/commands.ts';
import { Renderer } from './render.ts';
import { Sfx } from './sfx.ts';
import { h, mount, focusGroup, focusStep, focusActivate, focusIndex, type FocusGroup } from './dom.ts';

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
  /** First-ever session: show the NORMAL/INSERT primer in the briefing. */
  firstTime?: boolean;
  onHelp?: () => void;
  canSave?: boolean;
  onSave?: () => void;
  onWin(stars: Stars, keys: number, par: number): void;
  onNext(): void;
  onExit(): void;
  chapterForKey(key: string): number | null;
}

const KO = (s: Localized, lang: 'ko' | 'en'): string => (lang === 'ko' ? s.ko : s.en);

/** One sentence that says exactly what clears the chamber, in player words. */
function clearLabel(goal: Goal, lang: 'ko' | 'en'): string {
  const ko = lang === 'ko';
  switch (goal.type) {
    case 'reach':
      return ko ? `커서를 ${goal.char} 위에 올려라` : `Land the cursor on ${goal.char}`;
    case 'exact':
      return ko ? '버퍼를 목표 문서와 똑같이 만들어라' : 'Make the buffer match the target exactly';
    case 'lines':
      return ko ? `${goal.from}번째 줄을 고쳐라` : `Repair line ${goal.from}`;
    case 'none':
      return ko ? `${goal.chars} 를 하나도 남기지 마라` : `Leave no ${goal.chars} behind`;
    case 'collect':
      return ko ? `모든 ${goal.char} 위를 지나가라` : `Walk over every ${goal.char}`;
    case 'cursor':
      return ko ? '커서를 표시 지점에 놓아라' : 'Park the cursor on the mark';
    case 'all':
      return goal.of.map((g) => clearLabel(g, lang)).join(ko ? ' + ' : ' + ');
    default:
      return '';
  }
}

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
  private actions: FocusGroup | null = null;
  private coachEl: HTMLElement | null = null;
  private lastInputAt = 0;
  private coachStep = 0;

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
    this.session.vim.number = host.lineNumbers === 'abs' || host.lineNumbers === 'both';
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
    const lessonKeys = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id)?.keys)
      .filter(Boolean)
      .slice(0, 4)
      .join(' ');
    const lessonName = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => KO(n!, lang))
      .join(' · ');
    const objective = h(
      'div',
      { class: 'objective' },
      lessonKeys ? h('span', { class: 'lesson-chip', title: lessonName }, `${this.t('LEARN', '학습')} ${lessonKeys}`) : null,
      h('span', { class: 'goal' }, goalLabel(stage.goal, lang)),
      h('span', { class: 'spacer' }),
      this.host.onHelp ? h('button', { class: 'chip help', onclick: () => this.host.onHelp?.() }, lang === 'ko' ? 'F1 도움' : 'F1 HELP') : null,
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
        this.coachStep = Math.max(this.coachStep, 1);
        this.showCoach(this.coachText(0));
        break;
      case 'lost':
        this.state = 'lost';
        this.hideCoach();
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
        this.coachStep = Math.max(this.coachStep, 1);
        this.showCoach(`${msg} · ${this.t('TAB for a hint', 'TAB 힌트')}`);
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
    if (this.state === 'playing') {
      this.lastInputAt = performance.now();
      this.coachStep = 0;
      this.hideCoach();
    }
    if (e.repeat) return true; // our own repeat loop handles held keys
    if (this.state === 'intro' || this.state === 'won' || this.state === 'lost') {
      // Overlay buttons are navigated with Vim keys: h/l or j/k moves the
      // focus, Enter activates. Escape always leaves.
      if (e.key === 'j' || e.key === 'l') {
        if (this.actions) focusStep(this.actions, 1);
        return true;
      }
      if (e.key === 'k' || e.key === 'h') {
        if (this.actions) focusStep(this.actions, -1);
        return true;
      }
      if (e.key === 'Enter') {
        if (this.actions && focusActivate(this.actions)) return true;
        if (this.state === 'intro') this.begin();
        else if (this.state === 'won') this.host.onNext();
        else this.restart();
        return true;
      }
      if (e.key === 'Escape') {
        this.host.onExit();
        return true;
      }
      if (this.state === 'lost' && (e.key === 'r' || e.key === 'R')) {
        this.restart();
        return true;
      }
      if (this.state === 'intro') return false;
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
    const vim = this.session.vim;
    if (vim.mode === 'insert' || vim.mode === 'replace') {
      // The statusline already says INSERT; do not echo the whole insert text.
      this.echo.classList.remove('on');
      return;
    }
    if (vim.mode === 'cmdline' || vim.mode === 'search') {
      const kind = vim.cmdKind ?? (vim.mode === 'search' ? '/' : ':');
      this.echo.textContent = `${kind}${vim.cmdline}`;
      this.echo.classList.add('on');
      return;
    }
    const pending = vim.pendingCommand;
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
    this.echo.classList.remove('on');
    this.hideCoach();
    this.lastInputAt = performance.now();
    this.coachStep = 0;
    this.host.sfx.play('open');
    this.updateHud();
  }

  restart(): void {
    this.stopRepeat();
    this.session = this.session.restart();
    // Re-apply the gutter setting: restart() builds a fresh Vim with defaults.
    this.session.vim.number = this.host.lineNumbers === 'abs' || this.host.lineNumbers === 'both';
    this.session.vim.relativenumber = this.host.lineNumbers === 'rel' || this.host.lineNumbers === 'both';
    this.state = 'playing';
    this.overlay?.remove();
    this.overlay = null;
    this.echo.classList.remove('on');
    this.hintLevel = 0;
    this.flash = 0;
    this.shake = 0;
    this.matches = [];
    this.hideCoach();
    this.lastInputAt = performance.now();
    this.coachStep = 0;
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
    if (this.state === 'playing' && !this.ghosting) this.tickCoach(t);
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
        version: vim.buf.version,
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
    const taught = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .slice(0, 4);
    const why = stage.whisper
      ? KO(stage.whisper, lang)
      : taught[0]
        ? KO(taught[0].desc, lang)
        : lang === 'ko'
          ? '이 챔버를 정화하면 다음 섹터가 열린다.'
          : 'Clear this chamber to open the next sector.';
    const lesson = h(
      'div',
      { class: 'lesson' },
      h('div', { class: 'kicker' }, lang === 'ko' ? '배우는 것' : 'LEARN'),
      taught.length
        ? h(
            'div',
            {},
            ...taught.map((c) =>
              h(
                'div',
                { class: 'lesson-row' },
                h('code', {}, c.keys),
                h('span', { class: 'name' }, KO(c.name, lang)),
                h('span', { class: 'desc' }, KO(c.desc, lang)),
              ),
            ),
          )
        : h(
            'div',
            { class: 'lesson-row' },
            h('code', {}, '—'),
            h('span', { class: 'name' }, lang === 'ko' ? '섹터 복구' : 'SECTOR REPAIR'),
            h('span', { class: 'desc' }, goalLabel(stage.goal, lang)),
          ),
      h('div', { class: 'why' }, why),
    );
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'sigil-ghost' }, chapter.sigil),
      h('div', { class: 'eyebrow' }, `${lang === 'ko' ? '층' : 'FLOOR'} ${String(chapter.index).padStart(2, '0')} · ${KO(chapter.title, lang)} · ${stageIndex + 1}/${stageCount}`),
      h('h2', {}, KO(stage.name, lang)),
      h('div', { class: 'brief ko' }, KO(stage.brief, lang)),
      this.host.firstTime
        ? h(
            'div',
            { class: 'firsttime' },
            h('b', {}, this.t('NEW TO VIM?', 'VIM이 처음인가요?')),
            this.t(
              'You are in NORMAL mode. h j k l move, i types, Esc comes back. Enter starts.',
              '지금은 NORMAL 모드입니다. h j k l로 움직이고, i로 입력하고, Esc로 돌아옵니다. Enter로 시작.',
            ),
          )
        : null,
      lesson,
      h(
        'div',
        { class: 'facts' },
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '목표' : 'GOAL'), h('div', { class: 'v' }, goalLabel(stage.goal, lang))),
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '클리어' : 'CLEAR'), h('div', { class: 'v' }, clearLabel(stage.goal, lang))),
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
    this.actions = focusGroup(card);
    focusIndex(this.actions, 0);
  }

  private showResults(stars: Stars, keys: number, par: number): void {
    this.hideCoach();
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
    this.actions = focusGroup(card);
    focusIndex(this.actions, 0);
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
    this.actions = focusGroup(card);
    focusIndex(this.actions, 0);
  }

  private lessonKeys(): string {
    return (this.host.stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id)?.keys)
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');
  }

  /** Help that arrives without being asked, because a beginner is stuck. */
  private coachText(level: number): string {
    const { stage, lang } = this.host;
    const hints = stage.hints ?? [];
    if (level === 0) {
      if (hints[0]) return KO(hints[0], lang);
      const keys = this.lessonKeys();
      return keys
        ? this.t(`Try ${keys} — that is the lesson of this chamber.`, `${keys} 를 써 봐. 이 챔버의 교훈이야.`)
        : this.t('Press TAB for a hint, or F1 for the 60-second primer.', 'TAB으로 힌트를, F1으로 60초 입문을 봐.');
    }
    if (level === 1) {
      if (hints[1]) return KO(hints[1], lang);
      const keys = this.lessonKeys();
      return keys
        ? this.t(`The intended keys are ${keys}.`, `의도된 키는 ${keys} 이야.`)
        : this.t('Read the goal again, then try one small motion.', '목표를 다시 읽고, 작은 모션 하나부터 해 봐.');
    }
    return this.t(
      'Still stuck? TAB for another hint · F3 to watch the ghost · F1 for the primer.',
      '아직 막혔어? TAB으로 다음 힌트 · F3로 고스트 · F1으로 입문.',
    );
  }

  private tickCoach(t: number): void {
    if (!this.lastInputAt) return;
    // Auto-repeat feeds the session directly, so a held key must also count as
    // activity or the coach would pop up while the player is moving.
    if (this.repeating) this.lastInputAt = t;
    const idle = t - this.lastInputAt;
    const first = !!this.host.firstTime;
    if (this.coachStep === 0 && idle > (first ? 6000 : 10000)) {
      this.showCoach(this.coachText(0));
      this.coachStep = 1;
    } else if (this.coachStep === 1 && idle > (first ? 15000 : 24000)) {
      this.showCoach(this.coachText(1));
      this.coachStep = 2;
    } else if (this.coachStep === 2 && idle > (first ? 30000 : 45000)) {
      this.showCoach(this.coachText(2));
      this.coachStep = 3;
    }
  }

  private showCoach(text: string): void {
    if (this.state !== 'playing') return;
    this.coachEl?.remove();
    this.coachEl = h(
      'div',
      { class: 'coach' },
      h('div', { class: 'coach-k' }, this.t('COACH', '코치')),
      h('div', { class: 'coach-t' }, text),
      h('div', { class: 'coach-h' }, this.t('TAB more · F1 help', 'TAB 더 · F1 도움')),
    );
    this.root.append(this.coachEl);
  }

  private hideCoach(): void {
    this.coachEl?.remove();
    this.coachEl = null;
  }

  private showHint(): void {
    if (this.state !== 'playing') return;
    this.lastInputAt = performance.now();
    this.coachStep = Math.max(this.coachStep, 1);
    this.hideCoach();
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
    if (this.destroyed) return;
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
    this.hideCoach();
  }
}
