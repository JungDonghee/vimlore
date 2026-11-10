import { CHAPTERS } from '../../content/chapters/index.ts';
import { COMMANDS } from '../../content/commands.ts';
import type { Progress } from './types.ts';

/**
 * One model of "what the player knows", derived from progress + telemetry.
 * Every screen that talks about skills (Grimoire, progress map, weakness
 * trainer, results) reads this instead of re-deriving its own truth.
 */

export interface SkillRow {
  id: string;
  keys: string;
  name: string;
  desc: string;
  chapter: number;
  unlocked: boolean;
  learned: boolean;
  attempts: number;
  clears: number;
  /** 0..1 — how solid the command is, from telemetry. */
  mastery: number;
}

export interface SkillModel {
  rows: SkillRow[];
  byChapter: { index: number; title: string; unlocked: boolean; total: number; learned: number; rows: SkillRow[] }[];
  totals: { unlocked: number; learned: number; mastered: number; total: number };
}

export function skillModel(p: Progress): SkillModel {
  const chapterDone = (i: number): boolean => {
    const ch = CHAPTERS[i];
    return !!ch && ch.stages.length > 0 && ch.stages.every((s) => p.stages[s.id]?.cleared);
  };
  const chapterOpen = (i: number): boolean => i === 0 || chapterDone(i - 1);

  const rows: SkillRow[] = COMMANDS.map((c) => {
    const unlocked = chapterOpen(c.chapter - 1) || (p.stats[c.id]?.attempts ?? 0) > 0;
    const st = p.stats[c.id] ?? p.stats[c.keys] ?? { attempts: 0, clears: 0, keys: 0, par: 0, restarts: 0 };
    const learned = st.clears > 0;
    const rate = st.attempts ? st.clears / st.attempts : 0;
    const eff = st.par ? Math.min(1, st.par / Math.max(1, st.keys)) : 0;
    const mastery = learned ? Math.min(1, 0.55 + 0.45 * rate * Math.max(0.4, eff)) : 0;
    return {
      id: c.id,
      keys: c.keys,
      name: c.name.en,
      desc: c.desc.en,
      chapter: c.chapter,
      unlocked,
      learned,
      attempts: st.attempts,
      clears: st.clears,
      mastery,
    };
  });

  const byChapter = CHAPTERS.map((ch, i) => {
    const rs = rows.filter((r) => r.chapter === ch.index);
    return {
      index: ch.index,
      title: ch.title.en,
      unlocked: chapterOpen(i),
      total: rs.length,
      learned: rs.filter((r) => r.learned).length,
      rows: rs,
    };
  });

  return {
    rows,
    byChapter,
    totals: {
      unlocked: rows.filter((r) => r.unlocked).length,
      learned: rows.filter((r) => r.learned).length,
      mastered: rows.filter((r) => r.mastery >= 0.85).length,
      total: rows.length,
    },
  };
}

// ---------------------------------------------------------------- activity

const dayKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function bumpActivity(p: Progress, n = 1): void {
  const k = dayKey(new Date());
  p.activity[k] = (p.activity[k] ?? 0) + n;
}

export interface GrassDay {
  key: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/** GitHub-style grid: `weeks` columns ending today. */
export function activityGrid(p: Progress, weeks = 20): GrassDay[][] {
  const days: GrassDay[][] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1) - today.getDay());
  const cursor = new Date(start);
  let col: GrassDay[] = [];
  for (let i = 0; i < weeks * 7 + 7; i++) {
    const key = dayKey(cursor);
    const count = p.activity[key] ?? 0;
    const level = count === 0 ? 0 : count < 3 ? 1 : count < 8 ? 2 : count < 15 ? 3 : 4;
    col.push({ key, count, level });
    if (cursor.getDay() === 6) {
      days.push(col);
      col = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days.slice(-weeks);
}

export function streak(p: Progress): number {
  const d = new Date();
  if ((p.activity[dayKey(d)] ?? 0) === 0) d.setDate(d.getDate() - 1);
  let n = 0;
  for (let i = 0; i < 400; i++) {
    if ((p.activity[dayKey(d)] ?? 0) > 0) {
      n++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return n;
}
