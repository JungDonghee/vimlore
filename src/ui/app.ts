import { CHAPTERS } from '../content/chapters/index.ts';
import { COMMANDS, chapterUnlockKeys, chapterForKey } from '../content/commands.ts';
import { emptyProgress, type Chapter, type Progress, type StageRecord, type Stars } from '../core/game/types.ts';
import { generateTrial, dailySeed, skillLabel, TRIAL_SKILLS, type Trial } from '../core/game/trials.ts';
import { weakestSkills, recordStat, encodeSave, decodeSave, weaknessScore } from '../core/game/stats.ts';
import { skillModel, activityGrid, streak, bumpActivity } from '../core/game/skills.ts';
import { h, mount, isTouch } from './dom.ts';
import { Sfx } from './sfx.ts';
import { PlayScreen } from './play.ts';

const SAVE_KEY = 'vimlore.save.v2';

type Screen = 'title' | 'map' | 'play' | 'codex' | 'about' | 'trials' | 'progress';

const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));

export const chapterCleared = (p: Progress, idx: number): boolean => {
  const ch = CHAPTERS[idx];
  if (!ch || ch.stages.length === 0) return false;
  return ch.stages.every((s) => p.stages[s.id]?.cleared);
};

export const chapterUnlocked = (p: Progress, idx: number): boolean => idx === 0 || chapterCleared(p, idx - 1);

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw) as Progress;
    if (typeof p !== 'object' || !p.stages) return emptyProgress();
    return { ...emptyProgress(), ...p };
  } catch {
    return emptyProgress();
  }
}

function rankOf(stars: number): { en: string; ko: string } {
  if (stars >= 45) return { en: 'Lorekeeper', ko: '로어키퍼' };
  if (stars >= 36) return { en: 'Vim Master', ko: '빔 마스터' };
  if (stars >= 25) return { en: 'Cursor Adept', ko: '커서 숙련자' };
  if (stars >= 15) return { en: 'Wordsmith', ko: '워드스미스' };
  if (stars >= 6) return { en: 'Scribe', ko: '필경사' };
  return { en: 'Initiate', ko: '입문자' };
}

export class App {
  root: HTMLElement;
  sfx = new Sfx();
  progress: Progress;
  screen: Screen = 'title';
  chapterIndex = 0;
  stageIndex = 0;
  play: PlayScreen | null = null;
  mapSel = 0;
  private mapFloors: HTMLElement[] = [];
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(root: HTMLElement) {
    this.root = root;
    this.progress = loadProgress();
    this.mapSel = clamp(this.progress.currentChapter, 0, CHAPTERS.length - 1);
    this.keyHandler = (e) => this.onKey(e);
    window.addEventListener('keydown', this.keyHandler);
    window.addEventListener('keyup', (e) => this.play?.handleKeyUp(e));
    window.addEventListener('blur', () => this.play?.stopRepeatNow());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.play?.stopRepeatNow(); });
    this.applyCrt();
  }

  // ------------------------------------------------------------------- utils

  get lang(): 'ko' | 'en' {
    return this.progress.lang;
  }

  t(en: string, ko: string): string {
    return this.lang === 'ko' ? ko : en;
  }

  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress));
    } catch {
      /* private mode: play without persistence */
    }
  }

  totalStars(): number {
    return Object.values(this.progress.stages).reduce((n, s) => n + s.stars, 0);
  }

  totalPossible(): number {
    return CHAPTERS.reduce((n, c) => n + c.stages.length * 3, 0);
  }

  /** Every floor is the same green tube, with a whisper of drift. */
  phosphorHue(chapterIndex: number): number {
    return 122 + ((chapterIndex * 7) % 3) * 6;
  }

  private hue(h: number): void {
    document.documentElement.style.setProperty('--hue', String(h));
  }

  applyCrt(): void {
    document.body.classList.toggle('crt-on', this.progress.crt);
    document.body.classList.toggle('crt-off', !this.progress.crt);
  }

  private killPlay(): void {
    this.play?.destroy();
    this.play = null;
  }

  // ----------------------------------------------------------------- screens

  goTitle(): void {
    this.killPlay();
    this.screen = 'title';
    this.hue(128);
    const letters = 'VIMLORE'.split('');
    const log = [
      'VIMLORE BIOS v0.9  (c) NOBODY',
      'MEMORY ......... 640K OK',
      'MOUNT /dev/words ......... <b>FAILED</b>',
      'MOUNT /dev/code .......... <b>READ ONLY</b>',
      'SCAN BUFFER 0x0001 ....... 1024 LINES, 3 CORRUPT',
      '> WAITING FOR A CURSOR_',
    ];
    mount(
      this.root,
      h(
        'div',
        { class: 'title-screen fade-in' },
        h(
          'div',
          { class: 'bootlog' },
          ...log.map((line, i) => h('div', { style: { animationDelay: `${0.15 + i * 0.13}s` } }, ...(() => {
            const parts = line.split(/<b>|<\/b>/);
            return parts.map((p, j) => (j % 2 ? h('b', {}, p) : document.createTextNode(p)));
          })())),
        ),
        h(
          'div',
          { class: 'title-mark' },
          ...letters.map((c, i) => h('span', { style: { animationDelay: `${i * 0.07}s` } }, c)),
        ),
        h('div', { class: 'title-rule' }),
        h('div', { class: 'title-tag ko' }, this.t('The world is written. Rewrite it.', '세계는 쓰여 있다. 다시 써라.')),
        h('div', { class: 'title-sub' }, this.t('a vim adventure · 10 floors · 51 chambers', '빔 어드벤처 · 10개 층 · 51개 챔버')),
        h('div', { class: 'title-credit' }, this.t('created by', '만든 사람'), ' ', h('b', {}, 'JUNG DONGHEE')),
        h('div', { class: 'press' }, this.t('PRESS ANY KEY', '아무 키나 누르세요')),
        isTouch() ? h('div', { class: 'title-foot ko' }, this.t('a physical keyboard is required', '물리 키보드가 필요합니다')) : null,
        h('div', { class: 'title-foot' }, 'v1.0 · offline · no tracking · made by Jung Donghee'),
      ),
    );
  }

  goMap(): void {
    this.killPlay();
    this.screen = 'map';
    const stars = this.totalStars();
    const rank = rankOf(stars);
    this.mapFloors = CHAPTERS.map((c, i) => {
      const unlocked = chapterUnlocked(this.progress, i);
      const total = c.stages.length * 3;
      const got = c.stages.reduce((n, s) => n + (this.progress.stages[s.id]?.stars ?? 0), 0);
      const cleared = chapterCleared(this.progress, i);
      const el = h(
        'div',
        {
          class: `floor${unlocked ? '' : ' locked'}`,
          style: { '--fh': String(this.phosphorHue(i)) },
          onclick: () => this.selectFloor(i, true),
        },
        h('div', { class: 'sig' }, unlocked ? c.sigil : '⊘'),
        h(
          'div',
          {},
          h('div', { class: 'name' }, h('span', { class: 'num' }, `FLOOR ${String(i + 1).padStart(2, '0')}`), this.lang === 'ko' ? c.title.ko : c.title.en),
          h('div', { class: 'sub ko' }, unlocked ? (this.lang === 'ko' ? c.subtitle.ko : c.subtitle.en) : this.t('sealed — clear the floor below', '봉인됨 — 아래층을 먼저')),
          unlocked ? h('div', { class: 'story ko', style: { display: 'none' } }, this.lang === 'ko' ? c.story.ko : c.story.en) : null,
        ),
        h('div', { class: 'stars' }, cleared ? '★' : '☆', ' ', h('span', { class: got > 0 ? '' : 'off' }, `${got}/${total}`)),
      );
      return el;
    });

    mount(
      this.root,
      h(
        'div',
        { class: 'screen fade-in' },
        h(
          'div',
          { class: 'topbar' },
          h('h1', {}, 'VIMLORE'),
          h('div', { class: 'meta' }, `${rank[this.lang]} · ★ ${stars}/${this.totalPossible()} · ${this.progress.totalKeys} ${this.t('keys', '키')}`),
        ),
        h('div', { class: 'map-wrap' }, h('div', { class: 'map' }, ...this.mapFloors)),
        h(
          'div',
          { class: 'map-foot' },
          h('span', { class: 'ko' }, this.t('↑↓ select · ↵ enter', '↑↓ 선택 · ↵ 입장')),
          h(
            'span',
            { style: { display: 'flex', gap: '8px' } },
            h('button', { class: 'chip', onclick: () => this.goProgress() }, this.t('P · PROGRESS', 'P · 성장')),
            h('button', { class: 'chip', onclick: () => this.goTrials() }, this.t('T · TRIALS', 'T · 시련')),
            h('button', { class: 'chip', onclick: () => this.goCodex() }, this.t('C · GRIMOIRE', 'C · 마법서')),
            h('button', { class: 'chip', onclick: () => this.goAbout() }, this.t('S · SETTINGS', 'S · 설정')),
          ),
        ),
      ),
    );
    this.paintMap();
  }

  /** Repaint only the selection: no DOM rebuild, no flash, no scroll jump. */
  private paintMap(): void {
    this.mapFloors.forEach((el, i) => {
      const on = i === this.mapSel;
      el.classList.toggle('sel', on);
      const story = el.querySelector('.story') as HTMLElement | null;
      if (story) story.style.display = on ? 'block' : 'none';
    });
    const el = this.mapFloors[this.mapSel];
    if (el) {
      const r = el.getBoundingClientRect();
      const top = el.parentElement?.parentElement?.getBoundingClientRect();
      if (top && (r.top < top.top + 8 || r.bottom > top.bottom - 8)) el.scrollIntoView({ block: 'nearest' });
    }
  }

  private selectFloor(i: number, enter: boolean): void {
    this.mapSel = clamp(i, 0, CHAPTERS.length - 1);
    if (this.mapSel >= this.mapFloors.length) return;
    if (!chapterUnlocked(this.progress, this.mapSel)) {
      this.sfx.play('locked');
      this.paintMap();
      return;
    }
    this.paintMap();
    if (enter) this.enterChapter(this.mapSel);
  }

  enterChapter(i: number): void {
    this.chapterIndex = i;
    const ch = CHAPTERS[i];
    if (!ch || ch.stages.length === 0) {
      this.sfx.play('locked');
      return;
    }
    this.stageIndex = 0;
    // resume at the first uncleared stage
    const firstOpen = ch.stages.findIndex((s) => !this.progress.stages[s.id]?.cleared);
    this.stageIndex = firstOpen === -1 ? 0 : firstOpen;
    this.startStage();
  }

  startStage(): void {
    const ch = CHAPTERS[this.chapterIndex];
    const stage = ch.stages[this.stageIndex];
    if (!stage) return;
    this.killPlay();
    this.screen = 'play';
    this.hue(this.phosphorHue(this.chapterIndex));
    const allowed = chapterUnlockKeys(CHAPTERS, this.chapterIndex);
    const rec = this.progress.stages[stage.id];
    const play = new PlayScreen(this.root, {
      sfx: this.sfx,
      lang: this.lang,
      chapter: ch,
      stage,
      stageIndex: this.stageIndex,
      stageCount: ch.stages.length,
      allowed,
      bestStars: rec?.stars ?? 0,
      bestKeys: rec?.cleared ? rec.bestKeys : null,
      crt: this.progress.crt,
      chapterForKey: (k) => chapterForKey(k),
      onWin: (stars, keys) => this.recordClear(stage.id, stars, keys),
      onNext: () => this.nextStage(),
      onExit: () => this.goMap(),
    });
    this.play = play;
    play.mount();
  }

  private recordClear(id: string, stars: Stars, keys: number): void {
    const st = CHAPTERS[this.chapterIndex]?.stages.find((x) => x.id === id);
    recordStat(this.progress, st?.teaches?.[0] ?? `floor${this.chapterIndex + 1}`, { cleared: stars > 0, keys, par: st?.par ?? keys });
    bumpActivity(this.progress);
    const prev: StageRecord | undefined = this.progress.stages[id];
    const better = !prev || stars > prev.stars || (stars === prev.stars && keys < prev.bestKeys);
    this.progress.stages[id] = {
      cleared: true,
      stars: better ? stars : prev!.stars,
      bestKeys: better ? keys : prev!.bestKeys,
    };
    this.progress.totalKeys += keys;
    this.progress.currentChapter = this.chapterIndex;
    this.save();
  }

  nextStage(): void {
    const ch = CHAPTERS[this.chapterIndex];
    if (this.stageIndex + 1 < ch.stages.length) {
      this.stageIndex++;
      this.startStage();
    } else if (this.chapterIndex + 1 < CHAPTERS.length && chapterUnlocked(this.progress, this.chapterIndex + 1)) {
      this.chapterIndex++;
      this.mapSel = this.chapterIndex;
      this.stageIndex = 0;
      this.startStage();
    } else {
      this.goMap();
    }
  }

  // ------------------------------------------------------------------ trials

  goTrials(): void {
    this.killPlay();
    this.screen = 'trials';
    this.hue(128);
    const weak = weakestSkills(this.progress, 3);
    const attempts = Object.values(this.progress.stats).reduce((n, s) => n + s.attempts, 0);
    const modes: { key: string; title: string; desc: string; run: () => void }[] = [
      { key: '1', title: this.t('ENDLESS', '무한'), desc: this.t('a fresh generated chamber, forever', '끝없이 생성되는 챔버'), run: () => this.startTrial('endless') },
      {
        key: '2',
        title: this.t('WEAKNESS', '약점 단련'),
        desc: weak.length ? `${this.t('bias', '가중')}: ${weak.map(skillLabel).join(' · ')}` : this.t('play a few rooms first', '먼저 몇 판 플레이'),
        run: () => this.startTrial('weak'),
      },
      { key: '3', title: this.t('DAILY', '데일리'), desc: `seed ${dailySeed()}`, run: () => this.startTrial('daily') },
    ];
    const saved = this.progress.saved.slice(-8).reverse();

    mount(
      this.root,
      h(
        'div',
        { class: 'screen fade-in' },
        h(
          'div',
          { class: 'topbar' },
          h('h1', {}, 'TRIALS'),
          h('div', { class: 'meta' }, `${attempts} ${this.t('attempts', '시도')} · ${this.progress.trialsCleared} ${this.t('cleared', '클리어')} · ${this.progress.saved.length} ${this.t('saved', '저장')}`),
        ),
        h(
          'div',
          { class: 'map-wrap' },
          h(
            'div',
            { class: 'map' },
            ...modes.map((m) =>
              h(
                'div',
                { class: 'floor', onclick: m.run, style: { '--fh': '130' } },
                h('div', { class: 'sig' }, m.key),
                h('div', {}, h('div', { class: 'name' }, m.title), h('div', { class: 'sub' }, m.desc)),
                h('div', { class: 'stars' }, '›'),
              ),
            ),
            saved.length
              ? h(
                  'div',
                  { style: { marginTop: '26px' } },
                  h('div', { class: 'kicker', style: { marginBottom: '8px' } }, this.t('SAVED CHAMBERS', '저장한 챔버')),
                  ...saved.map((sv) =>
                    h(
                      'div',
                      { class: 'floor', style: { '--fh': '130' }, onclick: () => this.startSavedTrial(sv.seed, sv.skill) },
                      h('div', { class: 'sig' }, '☆'),
                      h('div', {}, h('div', { class: 'name' }, skillLabel(sv.skill)), h('div', { class: 'sub' }, `seed ${sv.seed}`)),
                      h('div', { class: 'stars' }, '›'),
                    ),
                  ),
                )
              : null,
            this.statsTable(),
          ),
        ),
        h('div', { class: 'map-foot' }, h('span', {}, this.t('1/2/3 · play   ESC · back', '1/2/3 · 시작   ESC · 뒤로')), h('button', { class: 'chip', onclick: () => this.goMap() }, this.t('MAP', '지도'))),
      ),
    );
  }

  private statsTable(): HTMLElement | null {
    const rows = Object.entries(this.progress.stats)
      .map(([k, v]) => ({ k, v, s: weaknessScore(v) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 6);
    if (!rows.length) return null;
    return h(
      'div',
      { style: { marginTop: '26px' } },
      h('div', { class: 'kicker', style: { marginBottom: '8px' } }, this.t('WEAKNESS MAP', '약점 지도')),
      ...rows.map((r) =>
        h(
          'div',
          { class: 'row', style: { padding: '5px 0', borderBottom: '1px solid var(--line-soft)' } },
          h('span', {}, skillLabel(r.k)),
          h('b', {}, `${Math.round((r.v.clears / Math.max(1, r.v.attempts)) * 100)}% · ${(r.v.keys / Math.max(1, r.v.par)).toFixed(2)}× par`),
        ),
      ),
    );
  }

  private trialChapter(t: Trial): Chapter {
    return {
      id: 'trial',
      index: 0,
      title: { en: 'TRIALS', ko: '시련' },
      subtitle: { en: skillLabel(t.skillId), ko: skillLabel(t.skillId) },
      story: { en: '', ko: '' },
      sigil: '·',
      hue: 130,
      unlocks: [],
      stages: [t.stage],
    };
  }

  private startTrial(mode: 'endless' | 'weak' | 'daily', seedArg?: number): void {
    const weak = weakestSkills(this.progress, 3);
    const seed = seedArg ?? (mode === 'daily' ? dailySeed() : Math.floor(Math.random() * 1e9));
    const trial = mode === 'weak' ? generateTrial(seed, undefined, weak.length ? weak : undefined) : generateTrial(seed, undefined, mode === 'daily' ? undefined : weak);
    this.playTrial(trial, mode);
  }

  private startSavedTrial(seed: number, skill: string): void {
    const trial = generateTrial(seed, skill);
    this.playTrial(trial, 'endless');
  }

  private playTrial(trial: Trial, mode: 'endless' | 'weak' | 'daily'): void {
    const ch = this.trialChapter(trial);
    this.killPlay();
    this.screen = 'play';
    this.hue(128);
    const allowed = new Set<string>('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ '.split(''));
    const play = new PlayScreen(this.root, {
      sfx: this.sfx,
      lang: this.lang,
      chapter: ch,
      stage: trial.stage,
      stageIndex: 0,
      stageCount: 1,
      allowed,
      bestStars: 0,
      bestKeys: null,
      crt: this.progress.crt,
      canSave: true,
      chapterForKey: () => null,
      onSave: () => this.saveTrial(trial),
      onWin: (stars, keys) => {
        this.progress.trialsCleared++;
        bumpActivity(this.progress);
        recordStat(this.progress, trial.skillId, { cleared: stars > 0, keys, par: trial.stage.par });
        this.save();
      },
      onNext: () => this.startTrial(mode),
      onExit: () => this.goTrials(),
    });
    this.play = play;
    play.mount();
  }

  private saveTrial(t: Trial): void {
    if (this.progress.saved.some((s) => s.seed === t.seed && s.skill === t.skillId)) return;
    this.progress.saved.push({ seed: t.seed, skill: t.skillId, at: Date.now() });
    if (this.progress.saved.length > 60) this.progress.saved.shift();
    this.save();
  }

  goProgress(): void {
    this.killPlay();
    this.screen = 'progress';
    this.hue(128);
    const m = skillModel(this.progress);
    const grid = activityGrid(this.progress, 20);
    const total = Object.values(this.progress.activity).reduce((a, b) => a + b, 0);
    mount(
      this.root,
      h(
        'div',
        { class: 'screen fade-in' },
        h('div', { class: 'topbar' }, h('h1', {}, 'PROGRESS'), h('div', { class: 'meta' }, `${m.totals.learned}/${m.totals.total} ${this.t('skills', '스킬')} · ${streak(this.progress)}d ${this.t('streak', '연속')} · ★ ${this.totalStars()}`)),
        h(
          'div',
          { class: 'map-wrap' },
          h(
            'div',
            { class: 'map' },
            h('div', { class: 'kicker' }, `${total} ${this.t('actions logged', '기록된 행동')} · ${this.t('mastered', '숙련')} ${m.totals.mastered}`),
            h('div', { class: 'grass' }, ...grid.flatMap((col) => col.map((d) => h('i', { class: `g${d.level}`, title: `${d.key} · ${d.count}` })))),
            ...m.byChapter.map((ch) =>
              h(
                'div',
                { style: { marginTop: '18px' } },
                h('div', { class: 'kicker', style: { marginBottom: '6px' } }, `${String(ch.index).padStart(2, '0')} ${ch.title} · ${ch.learned}/${ch.total}${ch.unlocked ? '' : ' · SEALED'}`),
                h('div', {}, ...ch.rows.map((r) => h('span', { class: `sk ${r.learned ? 'on' : r.unlocked ? 'open' : 'off'}`, title: r.desc }, r.keys))),
              ),
            ),
          ),
        ),
        h('div', { class: 'map-foot' }, h('span', {}, this.t('solid = learned · outline = available · dim = locked', '채움=습득 · 테두리=가능 · 흐림=잠김')), h('button', { class: 'chip', onclick: () => this.goMap() }, this.t('MAP', '지도'))),
      ),
    );
  }

  goCodex(): void {
    this.killPlay();
    this.screen = 'codex';
    const groups = CHAPTERS.map((c, i) => {
      const unlocked = chapterUnlocked(this.progress, i);
      const cmds = COMMANDS.filter((x) => x.chapter === c.index);
      if (!cmds.length) return null;
      return h(
        'div',
        { style: { marginBottom: '18px' } },
        h('div', { class: 'kicker', style: { margin: '0 0 8px' } }, `${String(c.index).padStart(2, '0')} · ${this.lang === 'ko' ? c.title.ko : c.title.en}${unlocked ? '' : ' · SEALED'}`),
        h(
          'div',
          { class: 'codex-grid' },
          ...cmds.map((cmd) =>
            h(
              'div',
              { class: `cmd${unlocked ? '' : ' locked'}` },
              h('code', {}, cmd.keys),
              h('div', { class: 'ko' }, this.lang === 'ko' ? cmd.name.ko : cmd.name.en),
              h('div', { class: 'ch' }, this.lang === 'ko' ? cmd.desc.ko : cmd.desc.en),
            ),
          ),
        ),
      );
    }).filter(Boolean);

    mount(
      this.root,
      h(
        'div',
        { class: 'screen fade-in' },
        h('div', { class: 'topbar' }, h('h1', {}, this.t('GRIMOIRE', '마법서')), h('div', { class: 'meta' }, `${COMMANDS.length} ${this.t('commands', '명령')}`)),
        h('div', { class: 'map-scroll', style: { paddingTop: '18px' } }, ...groups),
        h('div', { class: 'map-foot' }, h('span', {}, this.t('ESC · back', 'ESC · 뒤로')), h('button', { class: 'chip', onclick: () => this.goMap() }, this.t('MAP', '지도'))),
      ),
    );
  }

  goAbout(): void {
    this.killPlay();
    this.screen = 'about';
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'eyebrow' }, 'VIMLORE'),
      h('h2', {}, this.t('Settings', '설정')),
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn', onclick: () => { this.sfx.setEnabled(!this.sfx.enabled); this.save(); this.goAbout(); } }, this.sfx.enabled ? this.t('sound: on', '소리: 켜짐') : this.t('sound: off', '소리: 꺼짐')),
        h('button', { class: 'btn', onclick: () => { this.progress.lang = this.progress.lang === 'ko' ? 'en' : 'ko'; this.save(); this.goAbout(); } }, this.lang === 'ko' ? 'language: 한국어' : 'language: english'),
        h('button', { class: 'btn', onclick: () => { this.progress.crt = !this.progress.crt; this.save(); this.applyCrt(); this.goAbout(); } }, this.progress.crt ? this.t('crt fx: on', 'CRT 효과: 켜짐') : this.t('crt fx: off', 'CRT 효과: 꺼짐')),
      ),
      h(
        'div',
        { class: 'actions' },
        h('button', {
          class: 'btn',
          onclick: () => {
            const name = prompt(this.t('Operator name', '오퍼레이터 이름'), this.progress.profile.name);
            if (name) { this.progress.profile.name = name.slice(0, 24); this.save(); this.goAbout(); }
          },
        }, `${this.t('operator', '오퍼레이터')}: ${this.progress.profile.name}`),
        h('button', {
          class: 'btn',
          onclick: () => {
            const code = encodeSave(this.progress);
            void navigator.clipboard?.writeText(code);
            prompt(this.t('Save code (copied) — keep it', '세이브 코드 (복사됨) — 보관하세요'), code);
          },
        }, this.t('export save', '세이브 내보내기')),
        h('button', {
          class: 'btn',
          onclick: () => {
            const code = prompt(this.t('Paste a save code', '세이브 코드 붙여넣기'));
            if (!code) return;
            const p = decodeSave(code);
            if (!p) { alert(this.t('Not a valid code', '올바른 코드가 아닙니다')); return; }
            this.progress = { ...emptyProgress(), ...p };
            this.save();
            this.goAbout();
          },
        }, this.t('import save', '세이브 가져오기')),
      ),
      h('div', { class: 'rule' }),
      h('div', { class: 'brief ko' }, this.t(
        'VIMLORE is a puzzle game played with a real Vim editor core. Every key you press is counted. Three stars means you solved it as elegantly as the level designer intended — not just eventually.',
        'VIMLORE는 진짜 Vim 엔진으로 노는 퍼즐 게임입니다. 누른 모든 키가 집계됩니다. 별 세 개는 "언젠가 풀었다"가 아니라 "설계자가 의도한 만큼 우아하게 풀었다"는 뜻입니다.',
      )),
      h('div', { class: 'rule' }),
      h('div', { class: 'row' }, h('span', {}, this.t('keys pressed', '누른 키')), h('b', {}, String(this.progress.totalKeys))),
      h('div', { class: 'row' }, h('span', {}, this.t('stars', '별')), h('b', {}, `${this.totalStars()} / ${this.totalPossible()}`)),
      h('div', { class: 'row', style: { marginTop: '6px' } }, h('span', {}, this.t('created by', '만든 사람')), h('b', {}, 'Jung Donghee')),
      h('div', { class: 'row', style: { marginTop: '6px' } }, h('span', {}, this.t('engine', '엔진')), h('b', {}, this.t('diff-tested against real vim', '실제 vim과 대조 검증'))),
      h('div', { class: 'actions' }, h('button', {
        class: 'btn',
        onclick: () => {
          if (confirm(this.t('Erase all progress?', '모든 진행을 지울까요?'))) {
            this.progress = emptyProgress();
            this.progress.lang = this.lang;
            this.save();
            this.goTitle();
          }
        },
      }, this.t('erase progress', '진행 초기화'))),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => this.goMap() }, this.t('BACK', '뒤로'), h('kbd', {}, 'esc'))),
    );
    mount(this.root, h('div', { class: 'overlay', style: { position: 'relative', background: 'transparent', backdropFilter: 'none' } }, card));
  }

  // -------------------------------------------------------------------- keys

  private onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.altKey) return;
    this.sfx.unlock();
    if (this.screen === 'title') {
      e.preventDefault();
      this.goMap();
      return;
    }
    if (this.screen === 'play') {
      if (this.play?.handleKey(e)) {
        e.preventDefault();
      }
      return;
    }
    if (this.screen === 'map') {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        this.selectFloor(this.mapSel - 1, false);
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        this.selectFloor(this.mapSel + 1, false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (chapterUnlocked(this.progress, this.mapSel)) this.enterChapter(this.mapSel);
        else this.sfx.play('locked');
      } else if (e.key === 'Escape') {
        this.goTitle();
      } else if (e.key === 'p' || e.key === 'P') {
        this.goProgress();
      } else if (e.key === 't' || e.key === 'T') {
        this.goTrials();
      } else if (e.key === 'c' || e.key === 'C') {
        this.goCodex();
      } else if (e.key === 's' || e.key === 'S') {
        this.goAbout();
      }
      return;
    }
    if (this.screen === 'trials') {
      if (e.key === '1') this.startTrial('endless');
      else if (e.key === '2') this.startTrial('weak');
      else if (e.key === '3') this.startTrial('daily');
      else if (e.key === 'Escape') this.goMap();
      return;
    }
    if (this.screen === 'progress') {
      if (e.key === 'Escape') this.goMap();
      return;
    }
    if (this.screen === 'codex' || this.screen === 'about') {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        this.goMap();
      }
    }
  }
}
