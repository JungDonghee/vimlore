/**
 * Level linter — the safety net that lets anyone (human or AI) add content.
 *
 *   node --experimental-strip-types tools/level-lint.ts [chapterNumber]
 *
 * For every stage it:
 *   1. loads the stage with the *chapter's* unlock set (so gated keys fail),
 *   2. replays `solution` keystroke by keystroke,
 *   3. asserts the stage is won, on the last key, in exactly `par` keys,
 *   4. asserts the win condition was not met earlier (no accidental shortcut),
 *   5. asserts bookkeeping (ids, teaches, hints, hazards, @ start marker).
 */
import { CHAPTERS } from '../src/content/chapters/index.ts';
import { tokenize } from '../src/core/vim/keys.ts';
import { Session } from '../src/core/game/session.ts';
import { chapterUnlockKeys, COMMAND_BY_ID } from '../src/content/commands.ts';
import { parseStart } from '../src/core/game/session.ts';
import type { Stage, Goal } from '../src/core/game/types.ts';

function collectChars(g: unknown): string[] {
  const gg = g as { type: string; char?: string; of?: unknown[] };
  if (gg.type === 'collect' && gg.char) return [gg.char];
  if (gg.type === 'all' && gg.of) return gg.of.flatMap(collectChars);
  return [];
}

function missingCoins(stage: Stage, collected: Set<number>): string[] {
  const chars = collectChars(stage.goal);
  if (!chars.length) return [];
  const out: string[] = [];
  stage.text.split('\n').forEach((line, i) => {
    for (let j = 0; j < line.length; j++) {
      if (chars.includes(line[j]) && !collected.has(i * 10000 + j)) out.push(`${i},${j}`);
    }
  });
  return out;
}

interface Row {
  chapter: number;
  stage: string;
  ok: boolean;
  problems: string[];
  notes: string[];
}

const arg = process.argv[2];
const filter = arg && /^\d+$/.test(arg) ? parseInt(arg, 10) : null;
const rows: Row[] = [];
const seenIds = new Set<string>();

function checkStage(ch: (typeof CHAPTERS)[number], stage: Stage): Row {
  const problems: string[] = [];
  const notes: string[] = [];
  const row: Row = { chapter: ch.index, stage: stage.id, ok: true, problems, notes };

  if (!stage.id.startsWith(ch.id)) problems.push(`id should start with ${ch.id}`);
  if (seenIds.has(stage.id)) problems.push('duplicate stage id');
  seenIds.add(stage.id);
  if (!stage.text.includes('@')) notes.push('no @ start marker (starts at 0,0)');
  if (stage.text.includes('@') && parseStart(stage.text).text.includes('@')) problems.push('more than one @');
  if (stage.par < 1) problems.push('par must be >= 1');
  if (!stage.solution) problems.push('missing solution');
  if (!stage.brief.en || !stage.brief.ko) problems.push('brief needs en+ko');
  if (!stage.name.en || !stage.name.ko) problems.push('name needs en+ko');
  for (const t of stage.teaches ?? []) if (!COMMAND_BY_ID.has(t)) problems.push(`unknown command id in teaches: ${t}`);

  const keys = stage.solution ? tokenize(stage.solution) : [];
  const allowed = chapterUnlockKeys(CHAPTERS, ch.index - 1);

  if (!keys.length) {
    problems.push('empty solution');
    row.ok = problems.length === 0;
    return row;
  }

  let s = new Session({ stage, chapterIndex: ch.index - 1, allowed });
  const trace: string[] = [];
  let wonAt = -1;
  for (let i = 0; i < keys.length; i++) {
    const accepted = s.feed(keys[i]);
    if (!accepted) {
      if (s.status === 'playing') problems.push(`key #${i + 1} "${keys[i]}" was blocked by the gate`);
      break;
    }
    if (s.status === 'won' && wonAt === -1) wonAt = i + 1;
    if (process.argv.includes('--trace')) trace.push(`  ${i + 1}. ${JSON.stringify(keys[i])} -> ${JSON.stringify(s.vim.buf.lines)} @${s.vim.cursor.line},${s.vim.cursor.col} ${s.vim.mode}`);
  }
  if (s.status === 'lost') problems.push('solution died on a hazard');
  if (s.status !== 'won') problems.push('solution does not win');
  if (wonAt !== -1 && wonAt < keys.length) problems.push(`wins early at ${wonAt}/${keys.length} keys`);
  if (stage.solution && keys.length !== stage.par) {
    problems.push(`par ${stage.par} != solution length ${keys.length}`);
  }
  if (s.damage > 0) notes.push(`solution took ${s.damage} damage`);
  if (s.status === 'won' && s.keys !== stage.par) notes.push(`won in ${s.keys} keys`);
  if (process.argv.includes('--dump') && s.status !== 'won') {
    notes.push(`buffer=${JSON.stringify(s.vim.buf.lines)} cursor=${s.vim.cursor.line},${s.vim.cursor.col}`);
  }
  if (process.argv.includes('--trace')) {
    for (const t of trace) notes.push(t);
  }
  const miss = missingCoins(stage, s.collected);
  if (miss.length) notes.push(`uncollected: ${miss.join(' ')}`);

  row.ok = problems.length === 0;
  return row;
}

for (const ch of CHAPTERS) {
  if (filter !== null && ch.index !== filter) continue;
  for (const stage of ch.stages) rows.push(checkStage(ch, stage));
}

let bad = 0;
for (const r of rows) {
  if (!r.ok) {
    bad++;
    console.log(`FAIL  c${String(r.chapter).padStart(2, '0')} ${r.stage}`);
    for (const p of r.problems) console.log(`        - ${p}`);
    for (const n of r.notes) console.log(`        . ${n}`);
  } else {
    const note = r.notes.length ? `  (${r.notes.join('; ')})` : '';
    console.log(`ok    c${String(r.chapter).padStart(2, '0')} ${r.stage}${note}`);
  }
}

const empties = CHAPTERS.filter((c) => c.stages.length === 0 && (filter === null || c.index === filter));
if (empties.length) console.log(`\nempty chapters (placeholders): ${empties.map((c) => c.index).join(', ')}`);
console.log(`\n${rows.length - bad}/${rows.length} stages valid`);
process.exit(bad ? 1 : 0);
