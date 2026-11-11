/**
 * Grammar matrix — systematic differential coverage of the taught surface.
 *
 *   node --experimental-strip-types tools/matrix.ts [--limit=N] [--write]
 *
 * Unlike tools/fuzz.ts (random keys), this generates *valid command trees*
 * from the engine grammar: count × operator × motion/text-object × mode over a
 * boundary-rich text set, then diffs buffer + cursor against real Vim. The
 * goal is exact equality inside the surface, not "close to Vim".
 *
 * Coverage is intentionally bounded for a fast local loop:
 *   - 8 texts (BOF/EOF, blank lines, indent, quotes, brackets, tags)
 *   - 2-3 cursor positions per text
 *   - 20 motions, 18 text objects, 8 operators, counts {none, 2}
 *   - normal, visual, visual-line, visual-block, plus doubled operators
 *
 * `--write` regenerates docs/MATRIX_REPORT.md. Exit 1 on any divergence or
 * engine exception; Vim errors are skipped (the sentinel detects them).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Vim } from '../src/core/vim/engine.ts';

import { makeCases, vimKeys, type MCase } from './matrix-cases.ts';

const argv = process.argv.slice(2);
const limitArg = argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 0;
const WRITE = argv.includes('--write');
const FILTER = argv.find((a) => a.startsWith('--filter='))?.split('=')[1] ?? '';

let cases = makeCases();
if (FILTER) cases = cases.filter((c) => c.cat.includes(FILTER) || c.keys.includes(FILTER));
if (Number.isFinite(LIMIT) && LIMIT > 0) cases = cases.slice(0, LIMIT);

const SENTINEL = '<Esc>i!<Esc>';
for (const c of cases) c.keys += SENTINEL;

const dir = mkdtempSync(join(tmpdir(), 'vimlore-matrix-'));
const outFile = join(dir, 'out.json');
const scriptFile = join(dir, 'run.vim');
const esc = (p: string) => p.replace(/\\/g, '/');

let script = `set nocompatible
set shiftwidth=2
set expandtab
set textwidth=72
let s:out = []
`;
for (const c of cases) {
  const lines = JSON.stringify(c.text.split('\n'));
  const [l, col] = c.cursor;
  script += `enew!
clearjumps
silent! call setcharsearch({'char': '', 'forward': 1, 'until': 0})
silent! %d _
call setline(1, ${lines})
call cursor(${l}, ${col + 1})
let &undolevels = -1
let &undolevels = 1000
silent! call setreg('"', '')
let @/ = ''
try
  call feedkeys("${vimKeys(c.keys)}", 'xt')
catch
endtry
call add(s:out, {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1]})
`;
}
script += `call writefile([json_encode(s:out)], '${esc(outFile)}')
qa!
`;
writeFileSync(scriptFile, script);

try {
  execFileSync('vim', ['-N', '-u', 'NONE', '-i', 'NONE', '-es', '-S', scriptFile], {
    stdio: ['ignore', 'ignore', 'ignore'],
    timeout: 300000,
  });
} catch (e) {
  console.error('vim run failed', e);
  process.exit(2);
}
const expected: { lines: string[]; cursor: [number, number] }[] = JSON.parse(readFileSync(outFile, 'utf8'));
if (expected.length !== cases.length) {
  console.error(`vim produced ${expected.length}/${cases.length} results`);
  process.exit(2);
}

function strip(r: { lines: string[]; cursor: [number, number] }) {
  const [line, col] = r.cursor;
  const row = line - 1;
  if (r.lines[row]?.[col] !== '!') return null;
  const lines = r.lines.slice();
  lines[row] = lines[row].slice(0, col) + lines[row].slice(col + 1);
  return { lines, cursor: r.cursor };
}

let pass = 0;
let skipped = 0;
const engineErrors: { c: MCase; error: string }[] = [];
const failures: { c: MCase; exp: { lines: string[]; cursor: [number, number] }; got: { lines: string[]; cursor: [number, number] } }[] = [];

cases.forEach((c, i) => {
  const exp = strip(expected[i]);
  let gotRaw: { lines: string[]; cursor: [number, number] };
  try {
    const v = new Vim({ text: c.text, cursor: { line: c.cursor[0] - 1, col: c.cursor[1] }, strict: true });
    v.feedString(c.keys);
    gotRaw = { lines: v.buf.lines.slice(), cursor: [v.cursor.line + 1, v.cursor.col] };
  } catch (e) {
    engineErrors.push({ c, error: e instanceof Error ? e.message : String(e) });
    return;
  }
  const got = strip(gotRaw);
  if (!exp || !got) {
    skipped++;
    return;
  }
  const same = JSON.stringify(exp.lines) === JSON.stringify(got.lines) && exp.cursor[0] === got.cursor[0] && exp.cursor[1] === got.cursor[1];
  if (same) pass++;
  else failures.push({ c, exp, got });
});

const total = cases.length;
const byCat = new Map<string, number>();
for (const f of failures) byCat.set(f.c.cat, (byCat.get(f.c.cat) ?? 0) + 1);

console.log(`matrix: ${pass}/${total} matched; ${skipped} skipped; ${engineErrors.length} engine errors; ${failures.length} divergences`);
if (byCat.size) {
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('divergences by category:', JSON.stringify(Object.fromEntries(top)));
}
const show = Number(argv.find((a) => a.startsWith('--show='))?.split('=')[1] ?? 8);
for (const f of failures.slice(0, show)) {
  console.log(`\nFAIL ${f.c.name} [${f.c.cat}] keys=${JSON.stringify(f.c.keys)}`);
  console.log(`  text   ${JSON.stringify(f.c.text)} @${f.c.cursor}`);
  console.log(`  vim    ${JSON.stringify(f.exp.lines)} @${f.exp.cursor}`);
  console.log(`  engine ${JSON.stringify(f.got.lines)} @${f.got.cursor}`);
}
for (const e of engineErrors.slice(0, show)) {
  console.log(`\nERR ${e.c.name} [${e.c.cat}] keys=${JSON.stringify(e.c.keys)}: ${e.error}`);
}

if (WRITE) {
  const out: string[] = [];
  out.push('# MATRIX REPORT — grammar differential coverage');
  out.push('');
  out.push("> Generated by `npm run matrix -- --write`. Keys are fed with feedkeys('xt'),");
  out.push('> so a Vim error does not swallow later keys — the user-observable result.');
  out.push('> Matching is exact: lines + cursor. Engine exceptions are failures.');
  out.push('');
  out.push('| metric | value |');
  out.push('|---|---|');
  out.push(`| cases | ${total} |`);
  out.push(`| matched | ${pass} |`);
  out.push(`| engine errors | ${engineErrors.length} |`);
  out.push(`| divergences | ${failures.length} |`);
  out.push('');
  if (byCat.size) {
    out.push('## Divergences by category');
    out.push('');
    out.push('| category | count |');
    out.push('|---|---:|');
    for (const [k, v] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) out.push(`| ${k} | ${v} |`);
    out.push('');
  }
  if (failures.length) {
    out.push('## First ' + Math.min(40, failures.length) + ' failures');
    out.push('');
    for (const f of failures.slice(0, 40)) {
      out.push(`- \`${f.c.cat}\` keys=\`${f.c.keys}\` text=\`${JSON.stringify(f.c.text)}\` @${JSON.stringify(f.c.cursor)}`);
      out.push(`  - vim: \`${JSON.stringify(f.exp.lines)}\` @${JSON.stringify(f.exp.cursor)}`);
      out.push(`  - engine: \`${JSON.stringify(f.got.lines)}\` @${JSON.stringify(f.got.cursor)}`);
    }
    out.push('');
  }
  writeFileSync('docs/MATRIX_REPORT.md', out.join('\n'));
  console.log('wrote docs/MATRIX_REPORT.md');
}

if (failures.length || engineErrors.length) process.exit(1);
