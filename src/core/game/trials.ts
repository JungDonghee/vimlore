import { Session } from './session.ts';
import { tokenize } from '../vim/keys.ts';
import type { Stage } from './types.ts';

/**
 * TRIALS — procedurally generated chambers.
 *
 * Every candidate is *verified by simulation* before it is offered: we run the
 * intended solution through the real Session and accept the trial only if the
 * stage is won on the very last key. That makes "unbeatable generated level"
 * impossible by construction, not by luck.
 */

export type TrialTier = 1 | 2 | 3;

export interface TrialSkill {
  id: string;
  label: string;
  tier: TrialTier;
  /** Commands this drill trains; used by the weakness model. */
  keys: string[];
  make: (rng: () => number) => { text: string; goalText: string; keys: string; startChar?: string; blurb: string } | null;
}

const pick = <T,>(rng: () => number, xs: T[]): T => xs[Math.floor(rng() * xs.length) % xs.length];
const int = (rng: () => number, a: number, b: number): number => a + Math.floor(rng() * (b - a + 1));

/** Deterministic PRNG so a seed always reproduces the same chamber. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Generators. Each builds a puzzle *from* a known solution, then verification
// decides whether it ships.
// ---------------------------------------------------------------------------

const SKILLS: TrialSkill[] = [
  {
    id: 'delete-word',
    label: 'DELETE WORD',
    tier: 1,
    keys: ['d', 'w'],
    make: (rng) => {
      const n = int(rng, 3, 6);
      const junk = '## ';
      const lead = pick(rng, ['log: ', 'err: ', 'sys: ', 'net: ']);
      return {
        text: `${lead}${junk.repeat(n)}ok`,
        goalText: `${lead}ok`,
        keys: `f#${'dw'.repeat(n)}`,
        blurb: 'Strip the noise. db is not the tool here.',
      };
    },
  },
  {
    id: 'change-inner',
    label: 'CHANGE INNER WORD',
    tier: 2,
    keys: ['c', 'i', 'w'],
    make: (rng) => {
      const a = pick(rng, ['stale', 'wrong', 'dirty', 'false']);
      const b = pick(rng, ['fresh', 'right', 'clean', 'true']);
      const lead = pick(rng, ['state = ', 'flag = ', 'mode = ', 'ret = ']);
      return {
        text: `${lead}${a};`,
        goalText: `${lead}${b};`,
        keys: `2wciw${b}<Esc>`,
        blurb: 'One word is lying. Replace it without touching the rest.',
      };
    },
  },
  {
    id: 'change-quotes',
    label: 'CHANGE INSIDE QUOTES',
    tier: 2,
    keys: ['c', 'i', '"'],
    make: (rng) => {
      const n = int(rng, 2, 3);
      const olds = Array.from({ length: n }, () => pick(rng, ['old', 'tmp', 'null', 'void']));
      const news = newsFor(rng, n);
      const text = `call(${olds.map((o) => `"${o}"`).join(', ')});`;
      const goal = `call(${news.map((o) => `"${o}"`).join(', ')});`;
      const keys = `f"ci"${news[0]}<Esc>` + news.slice(1).map((w) => `f";ci"${w}<Esc>`).join('');
      return { text, goalText: goal, keys, blurb: 'The quotes stay. Only what they hold changes.' };
    },
  },
  {
    id: 'capture-case',
    label: 'OPERATOR + OBJECT',
    tier: 2,
    keys: ['g', 'U', 'i', 'w'],
    make: (rng) => {
      const name = pick(rng, ['token', 'buffer', 'cursor', 'register']);
      const val = pick(rng, ['42', '0x1f', '"ok"', 'true']);
      return {
        text: `const ${name} = ${val};`,
        goalText: `const ${name.toUpperCase()} = ${val};`,
        keys: `wgUiw`,
        blurb: 'Uppercase the identifier, nothing else.',
      };
    },
  },
  {
    id: 'indent-block',
    label: 'VISUAL INDENT',
    tier: 3,
    keys: ['V', '>'],
    make: (rng) => {
      const n = int(rng, 2, 3);
      const body = Array.from({ length: n }, (_, i) => `  call(${i});`);
      const text = ['fn main() {', ...body, '}'].join('\n');
      const goal = ['fn main() {', ...body.map((l) => `  ${l}`), '}'].join('\n');
      const keys = `jV${n - 1}j>`;
      return { text, goalText: goal, keys, blurb: 'Indent the body, leave the braces alone.' };
    },
  },
  {
    id: 'fix-typo',
    label: 'REPLACE CHAR',
    tier: 1,
    keys: ['r', 'f'],
    make: (rng) => {
      const v = pick(rng, ['300O', '0x1O', '4O4', 'l0O']);
      const fixed = v.replace('O', '0');
      return {
        text: `let port = ${v};`,
        goalText: `let port = ${fixed};`,
        keys: `fOr0`,
        blurb: 'A single character is wrong. Replace it, do not retype.',
      };
    },
  },
];

const NEWS = ['new', 'on', 'ok', 'yes', 'set', 'live'];
function newsFor(rng: () => number, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(pick(rng, NEWS) + (n > 2 ? String(i) : ''));
  return out;
}

/** All keys a trial may need are allowed: trials are never gated. */
function allowAll(keys: string): Set<string> {
  const set = new Set<string>();
  for (const k of tokenize(keys)) if (k.length === 1) set.add(k);
  for (const c of 'hjkl0123456789dcypPwiabAescxru."\'()[]{}<>=%~/ $') set.add(c);
  return set;
}

export interface Trial {
  seed: number;
  skillId: string;
  stage: Stage;
}

function stageFor(seed: number, skill: TrialSkill, body: NonNullable<ReturnType<TrialSkill['make']>>): Stage {
  return {
    id: `trial-${seed}`,
    name: { en: skill.label, ko: skill.label },
    brief: { en: body.blurb, ko: body.blurb },
    text: body.text.includes('@') ? body.text : body.text,
    goal: { type: 'exact', text: body.goalText },
    par: tokenize(body.keys).length,
    solution: body.keys,
    startChar: body.startChar,
    hazard: '',
    hints: [{ en: `target keystrokes: ${tokenize(body.keys).length}`, ko: `목표 키스트로크: ${tokenize(body.keys).length}` }],
  };
}

/** Reject anything that does not win exactly on its last key. */
function verify(stage: Stage): boolean {
  const keys = tokenize(stage.solution ?? '');
  if (!keys.length) return false;
  const s = new Session({ stage, chapterIndex: 0, allowed: allowAll(stage.solution ?? '') });
  let wonAt = -1;
  for (let i = 0; i < keys.length; i++) {
    if (!s.feed(keys[i])) return false;
    if (s.status === 'won' && wonAt === -1) wonAt = i + 1;
  }
  return s.status === 'won' && wonAt === keys.length;
}

export function trialFromSkill(seed: number, skill: TrialSkill): Trial | null {
  for (let attempt = 0; attempt < 12; attempt++) {
    const rng = mulberry32(seed + attempt * 7919);
    const body = skill.make(rng);
    if (!body) continue;
    const stage = stageFor(seed, skill, body);
    if (stage.text.includes('@')) continue;
    if (verify(stage)) return { seed, skillId: skill.id, stage };
  }
  return null;
}

export function generateTrial(seed: number, skillId?: string, weak?: string[]): Trial {
  const pool = skillId ? SKILLS.filter((s) => s.id === skillId) : SKILLS;
  const ordered = weak && weak.length && !skillId ? sortByWeakness(pool, weak) : pool;
  for (let i = 0; i < ordered.length * 3; i++) {
    const skill = ordered[i % ordered.length];
    const t = trialFromSkill(seed + i * 104729, skill);
    if (t) return t;
  }
  // Deterministic fallback that is always solvable.
  const fallback = SKILLS[0];
  const body = fallback.make(mulberry32(1))!;
  return { seed, skillId: fallback.id, stage: stageFor(seed, fallback, body) };
}

function sortByWeakness(pool: TrialSkill[], weak: string[]): TrialSkill[] {
  return [...pool].sort((a, b) => {
    const wa = weak.indexOf(a.id);
    const wb = weak.indexOf(b.id);
    return (wa === -1 ? 99 : wa) - (wb === -1 ? 99 : wb);
  });
}

export function dailySeed(date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export const TRIAL_SKILLS = SKILLS;
export const skillLabel = (id: string): string => SKILLS.find((s) => s.id === id)?.label ?? id;
