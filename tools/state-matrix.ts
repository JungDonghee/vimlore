/**
 * Observable-state matrix — the DM1 oracle.
 *
 *   node --experimental-strip-types tools/state-matrix.ts [--limit=N] [--show=N] [--write]
 *
 * Runs the same command trees as tools/matrix.ts, but compares more than
 * buffer + cursor: mode, the unnamed register (text + type), and the result of
 * pressing `u` afterwards. This is the "user-observable state" the next
 * command sees.
 *
 * Local-only until the generated set reaches 0; then it may join CI. Failures
 * are minimized into oracle cases as they are fixed.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Vim } from '../src/core/vim/engine.ts';
import { makeCases, vimKeys, type MCase } from './matrix-cases.ts';

interface Result {
  lines: string[];
  cursor: [number, number];
  reg: string;
  regtype: string;
  undo: { lines: string[]; cursor: [number, number] };
}

const argv = process.argv.slice(2);
const LIMIT = Number(argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0);
const FILTER = argv.find((a) => a.startsWith('--filter='))?.split('=')[1] ?? '';
const SHOW = Number(argv.find((a) => a.startsWith('--show='))?.split('=')[1] ?? 8);
const WRITE = argv.includes('--write');

let cases: MCase[] = makeCases();
if (FILTER) cases = cases.filter((c) => c.cat.includes(FILTER) || c.keys.includes(FILTER));
if (Number.isFinite(LIMIT) && LIMIT > 0) cases = cases.slice(0, LIMIT);

const dir = mkdtempSync(join(tmpdir(), 'vimlore-state-'));
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
let s:st = {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1], 'reg': getreg('"'), 'regtype': getregtype('"')}
try
  call feedkeys("u", 'xt')
catch
endtry
let s:st.undo = {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1]}
call add(s:out, s:st)
`;
}
script += `call writefile([json_encode(s:out)], '${esc(outFile)}')
qa!
`;
writeFileSync(scriptFile, script);

try {
  execFileSync('vim', ['-N', '-u', 'NONE', '-i', 'NONE', '-es', '-S', scriptFile], {
    stdio: ['ignore', 'ignore', 'ignore'],
    timeout: 600000,
  });
} catch (e) {
  console.error('vim run failed', e);
  process.exit(2);
}
const vimResults: Result[] = JSON.parse(readFileSync(outFile, 'utf8'));
if (vimResults.length !== cases.length) {
  console.error(`vim produced ${vimResults.length}/${cases.length} results`);
  process.exit(2);
}

function vimRegType(t: string): string {
  const c = t[0];
  if (c === 'V') return 'linewise';
  if (c === '\x16') return 'blockwise';
  return 'charwise';
}
function engineReg(v: Vim): { text: string; type: string } {
  const r = v.registers.get('"');
  if (!r) return { text: '', type: 'charwise' };
  return { text: r.text, type: r.blockwise ? 'blockwise' : r.linewise ? 'linewise' : 'charwise' };
}

function engineState(v: Vim): Result {
  const reg = engineReg(v);
  const state: Result = {
    lines: v.buf.lines.slice(),
    cursor: [v.cursor.line + 1, v.cursor.col],
    reg: reg.text,
    regtype: reg.type,
    undo: { lines: [], cursor: [1, 0] },
  };
  v.feedString('u');
  state.undo = { lines: v.buf.lines.slice(), cursor: [v.cursor.line + 1, v.cursor.col] };
  return state;
}

const samePos = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
const sameLines = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

const fieldCounts = new Map<string, number>();
const failures: { c: MCase; vim: Result; eng: Result; fields: string[] }[] = [];
const engineErrors: { c: MCase; error: string }[] = [];

for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const vim = vimResults[i];
  let eng: Result;
  try {
    const v = new Vim({ text: c.text, cursor: { line: c.cursor[0] - 1, col: c.cursor[1] }, strict: true });
    v.feedString(c.keys);
    eng = engineState(v);
  } catch (e) {
    engineErrors.push({ c, error: e instanceof Error ? e.message : String(e) });
    continue;
  }
  const normVim: Result = { ...vim, regtype: vimRegType(vim.regtype) };
  const initialLines = c.text.split('\n');
  const initialCursor: [number, number] = [c.cursor[0], c.cursor[1]];
  // Only a buffer change creates an undo entry; cursor-only commands (yanks,
  // motions) would make `u` undo the test setup itself.
  const changed = !sameLines(normVim.lines, initialLines);
  const fields: string[] = [];
  if (!sameLines(normVim.lines, eng.lines)) fields.push('buffer');
  if (!samePos(normVim.cursor, eng.cursor)) fields.push('cursor');
  if (normVim.reg !== eng.reg) fields.push('reg');
  if (normVim.regtype !== eng.regtype) fields.push('regtype');
  // Compare the observable state after `u` directly. Vim restores the cursor
  // to the last change position, not necessarily the test's initial cursor, so
  // comparing against initial would be wrong. No-change commands are skipped:
  // there `u` would undo the test setup instead.
  if (changed && (!sameLines(normVim.undo.lines, eng.undo.lines) || !samePos(normVim.undo.cursor, eng.undo.cursor))) {
    fields.push('undo');
  }
  if (fields.length) {
    for (const f of fields) fieldCounts.set(f, (fieldCounts.get(f) ?? 0) + 1);
    failures.push({ c, vim: normVim, eng, fields });
  }
}

const pass = cases.length - failures.length - engineErrors.length;
console.log(
  `state-matrix: ${pass}/${cases.length} matched; ${failures.length} divergences; ${engineErrors.length} engine errors`,
);
if (fieldCounts.size) {
  console.log('by field:', JSON.stringify(Object.fromEntries([...fieldCounts].sort((a, b) => b[1] - a[1]))));
}
for (const f of failures.slice(0, SHOW)) {
  console.log(`\nFAIL ${f.c.name} [${f.c.cat}] keys=${JSON.stringify(f.c.keys)} fields=${f.fields.join(',')}`);
  console.log(`  text ${JSON.stringify(f.c.text)} @${f.c.cursor}`);
  console.log(`  vim  ${JSON.stringify(f.vim)}`);
  console.log(`  eng  ${JSON.stringify(f.eng)}`);
}
for (const e of engineErrors.slice(0, SHOW)) {
  console.log(`\nERR ${e.c.name} [${e.c.cat}] ${JSON.stringify(e.c.keys)}: ${e.error}`);
}

if (WRITE) {
  const out: string[] = [];
  out.push('# STATE MATRIX REPORT — observable-state differential');
  out.push('');
  out.push("> Generated by `npm run state-matrix -- --write`. Compares buffer, cursor,");
  out.push('> unnamed register (text/type), and the state after `u`. Local until 0.');
  out.push('> Mode is NOT comparable through `vim -es` (`mode()` reports `c`); a pty/Nvim');
  out.push('> probe would be needed, so it is deliberately outside this report.');
  out.push('');
  out.push('| metric | value |');
  out.push('|---|---|');
  out.push(`| cases | ${cases.length} |`);
  out.push(`| matched | ${pass} |`);
  out.push(`| divergences | ${failures.length} |`);
  out.push(`| engine errors | ${engineErrors.length} |`);
  out.push('');
  if (fieldCounts.size) {
    out.push('| field | count |');
    out.push('|---|---:|');
    for (const [k, n] of [...fieldCounts].sort((a, b) => b[1] - a[1])) out.push(`| ${k} | ${n} |`);
    out.push('');
  }
  for (const f of failures.slice(0, 80)) {
    out.push(`- \`${f.c.cat}\` keys=\`${f.c.keys}\` text=\`${JSON.stringify(f.c.text)}\` @${JSON.stringify(f.c.cursor)} fields=${f.fields.join(',')}`);
    out.push(`  - vim: \`${JSON.stringify(f.vim)}\``);
    out.push(`  - eng: \`${JSON.stringify(f.eng)}\``);
  }
  writeFileSync('docs/STATE_REPORT.md', out.join('\n'));
  console.log('wrote docs/STATE_REPORT.md');
}

if (failures.length || engineErrors.length) process.exit(1);
