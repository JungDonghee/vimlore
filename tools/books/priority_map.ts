/**
 * Map priority-book command citations to the game's Grimoire/stage graph.
 * Exact matches are authoritative; prefix matches are explicitly marked and
 * are not treated as curriculum coverage.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { COMMANDS } from '../../src/content/commands.ts';
import { CHAPTERS } from '../../src/content/chapters/index.ts';

const audit = JSON.parse(readFileSync('books-index/priority/audit.json', 'utf8')) as {
  chapters: { id: string; book: string; chapter: number; title: string; commands: { keys: string; meaning: string; line: number }[] }[];
};

const byId = new Map(COMMANDS.map((c) => [c.id, c]));
const byKeys = new Map(COMMANDS.map((c) => [c.keys, c]));
const stageFor = new Map<string, { chapter: number; stage: string; name: string }>();
for (const ch of CHAPTERS) {
  ch.stages.forEach((st) => {
    for (const id of st.teaches ?? []) {
      if (!stageFor.has(id)) stageFor.set(id, { chapter: ch.index, stage: st.id, name: st.name.en });
    }
  });
}

function match(keys: string) {
  const k = keys.trim();
  if (byId.has(k)) return { kind: 'exact', cmd: byId.get(k)! };
  if (byKeys.has(k)) return { kind: 'exact', cmd: byKeys.get(k)! };
  // No first-character fuzzy mapping: that turned `vim --version` into `v`
  // (Visual mode). Anything not an exact Grimoire id/keys is unmatched.
  return { kind: 'none', cmd: null };
}

const rows: any[] = [];
for (const ch of audit.chapters) {
  for (const c of ch.commands) {
    const m = match(c.keys);
    const stage = m.cmd ? stageFor.get(m.cmd.id) : undefined;
    rows.push({ ...c, book: ch.book, chapter: ch.chapter, chapterTitle: ch.title, match: m.kind, gameId: m.cmd?.id ?? null, gameKeys: m.cmd?.keys ?? null, stage: stage ?? null });
  }
}
const summary = {
  citations: rows.length,
  exact: rows.filter((r) => r.match === 'exact').length,
  unmatched: rows.filter((r) => r.match === 'none').length,
  inStage: rows.filter((r) => r.match === 'exact' && r.stage).length,
};
writeFileSync('books-index/priority/curriculum-map.json', JSON.stringify({ summary, rows }, null, 2) + '\n');
const md = ['# Priority books → game key overlap (NOT semantic coverage)', '', 'Exact key/id matches only. The same key can mean something different in context (e.g. Modern Vim uses Ctrl-V for an fzf vertical split, while the game uses it for Visual Block); verify the cited meaning/stage before treating it as curriculum coverage. Anything else is unmatched.', '', `- citations: ${summary.citations}`, `- exact: ${summary.exact}`, `- unmatched: ${summary.unmatched}`, `- exact citations landing in a stage: ${summary.inStage}`, '', '| book | ch | keys | book meaning | game key | key exists in stage |', '|---|---:|---|---|---|---|'];
for (const r of rows.filter((x) => x.match === 'exact')) md.push(`| ${r.book} | ${r.chapter} | \`${r.keys.replace(/\|/g, '\\|')}\` | ${r.meaning.replace(/\|/g, '\\|')} | ${r.gameId ?? '—'} | ${r.stage ? `${r.stage.chapter}/${r.stage.stage}` : '—'} |`);
writeFileSync('books-index/priority/CURRICULUM_MAP.md', md.join('\n') + '\n');
console.log(summary);
