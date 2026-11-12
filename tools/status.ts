/**
 * Generated project status — the single source of truth for numbers.
 *
 *   npm run status:write   # regenerate docs/STATUS.md
 *   npm run status:check   # fail if the committed status is stale
 *
 * Numbers are derived from generated artifacts, never hand-copied:
 * tests/vim-expected.json, matrix cases, count manifest/cases, STATE_REPORT.md,
 * chapters, and the built single file. Gzip is deliberately omitted because
 * local zlib-ng and CI stock zlib differ; the budget gate owns that.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { MAX_GZIP, MAX_RAW } from './bundle-budget.ts';
import { makeCases } from './matrix-cases.ts';
import { MANIFEST, countCases } from './command-manifest.ts';
import { CHAPTERS } from '../src/content/chapters/index.ts';
import { existsSync as exists, readFileSync as read } from 'node:fs';

const oracle = (JSON.parse(readFileSync('tests/vim-expected.json', 'utf8')) as unknown[]).length;
const matrix = makeCases().length;
const count = countCases().length;
const countedRows = MANIFEST.filter((m) => m.count === 'yes' || m.count === 'ignored').length;
const stages = CHAPTERS.reduce((n, c) => n + c.stages.length, 0);

const report = readFileSync('docs/STATE_REPORT.md', 'utf8');
const pick = (name: string) => new RegExp(`^\\| ${name} \\| (\\d+) \\|$`, 'm').exec(report)?.[1];
const total = pick('cases'), matched = pick('matched'), open = pick('divergences');
const state = total && matched && open ? { matched: Number(matched), total: Number(total), open: Number(open) } : null;
const fields = [...report.matchAll(/^\| (undo|reg|regtype) \| (\d+) \|$/gm)].map((x) => `${x[1]} ${x[2]}`);
const raw = existsSync('dist/vimlore.html') ? statSync('dist/vimlore.html').size : null;
const booksMeta = exists('books-index/books.json') ? JSON.parse(read('books-index/books.json', 'utf8')) as { lines: number; headings: number }[] : null;
const coverage = exists('books-index/coverage.json') ? JSON.parse(read('books-index/coverage.json', 'utf8')) as { complete: boolean; chunks: number } : null;
const audit = exists('books-index/agent-audit.json') ? JSON.parse(read('books-index/agent-audit.json', 'utf8')) as { headings: unknown[]; problems: unknown[]; rejected: unknown[] } : null;

const lines = [
  '# STATUS — generated',
  '',
  '> **Do not edit by hand.** Run `npm run status:write` after regenerating the',
  '> oracle/matrix/count/state reports and the build. `npm run status:check` is a',
  '> CI gate. Gzip is intentionally omitted: local zlib-ng and CI stock zlib',
  `> differ; the bundle budget owns that (gzip ceiling ${MAX_GZIP.toLocaleString()} B).`,
  '',
  '| metric | value |',
  '|---|---:|',
  `| oracle cases | ${oracle} |`,
  `| matrix command trees | ${matrix.toLocaleString()} |`,
  `| count-matrix cases | ${count} |`,
  `| manifest rows (counted) | ${MANIFEST.length} (${countedRows}) |`,
  `| chapters / stages | ${CHAPTERS.length} / ${stages} |`,
  booksMeta ? `| books / source lines | ${booksMeta.length} / ${booksMeta.reduce((n, b) => n + b.lines, 0).toLocaleString()} |` : '| books | corpus not built |',
  coverage ? `| book chunks / coverage | ${coverage.chunks} / ${coverage.complete ? 'complete' : 'INCOMPLETE'} |` : '',
  audit ? `| audited book headings / problems / rejected | ${audit.headings.length} / ${audit.problems.length} / ${audit.rejected.length} |` : '| book audit | pending |',
  state ? `| state matrix matched / total / open | ${state.matched.toLocaleString()} / ${state.total.toLocaleString()} / ${state.open} |` : '| state matrix | report missing |',
  fields.length ? `| state open by field | ${fields.join(', ')} |` : '',
  raw === null ? '| built single file | not built |' : `| built single file (raw) | ${raw.toLocaleString()} B |`,
  `| raw ceiling | ${MAX_RAW.toLocaleString()} B |`,
  '',
  '## Reports',
  '',
  '- Oracle: `tools/oracle-diff.ts` + `tests/vim-expected.json`',
  '- Grammar matrix: `npm run matrix` → `docs/MATRIX_REPORT.md`',
  '- Count matrix + manifest: `npm run count-matrix` → `docs/COMMAND_MANIFEST.md`',
  '- Observable state (local): `npm run state-matrix -- --write` → `docs/STATE_REPORT.md`',
  '- Command/feature audit: `docs/VIM_COVERAGE.md`, `docs/VIM_ADVENTURES_COVERAGE.md`',
  '- Debugging: `npm run trace -- --case=m-1234` → `docs/DEBUGGING.md`',
  '- Browser QA: `npm run browser:qa` → `docs/BROWSER_QA.md` + `docs/browser/`',
  '- Books: `npm run books:build` → `docs/BOOKS_PIPELINE.md`; `npm run books:search -- ...`',
  '',
].filter(Boolean).join('\n');

const file = 'docs/STATUS.md';
if (process.argv.includes('--check')) {
  const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (old !== lines) {
    console.error('STATUS OUT OF DATE: run `npm run status:write` (reports/build changed)');
    process.exit(1);
  }
  console.log('status: docs/STATUS.md is current');
} else {
  writeFileSync(file, lines);
  console.log(`wrote ${file}`);
}
