/**
 * Count matrix — every manifest command at counts 1, 2 and 3.
 *
 *   node --experimental-strip-types tools/count-matrix.ts [--write] [--show=N]
 *
 * Compares buffer, cursor, unnamed register (text + type) and the state after
 * `u` against real Vim. Fails if a manifest row marked count:yes/ignored has no
 * case for 1, 2 and 3 (the CI structural gate). `--write` regenerates
 * docs/COMMAND_MANIFEST.md.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Vim } from '../src/core/vim/engine.ts';
import { vimKeys } from './matrix-cases.ts';
import { MANIFEST, countCases, manifestMarkdown } from './command-manifest.ts';

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const SHOW = Number(argv.find((a) => a.startsWith('--show='))?.split('=')[1] ?? 8);

if (WRITE) {
  writeFileSync('docs/COMMAND_MANIFEST.md', manifestMarkdown());
  console.log('wrote docs/COMMAND_MANIFEST.md');
}

const cases = countCases();
let coverageErrors = 0;
for (const s of MANIFEST) {
  if (s.count !== 'yes' && s.count !== 'ignored') continue;
  const counts = new Set(cases.filter((c) => c.spec === s).map((c) => c.count));
  for (const n of [1, 2, 3]) {
    if (!counts.has(n)) {
      console.error(`COVERAGE: ${s.cmd} is count:${s.count} but has no count ${n} case`);
      coverageErrors++;
    }
  }
}
if (coverageErrors) process.exit(2);

interface State {
  lines: string[];
  cursor: [number, number];
  reg: string;
  regtype: string;
  undo?: { lines: string[]; cursor: [number, number] };
}

const dir = mkdtempSync(join(tmpdir(), 'vimlore-count-'));
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
  script += `enew!
clearjumps
silent! call setcharsearch({'char': '', 'forward': 1, 'until': 0})
silent! %d _
call setline(1, ${lines})
call cursor(${c.cursor[0]}, ${c.cursor[1] + 1})
let &undolevels = -1
let &undolevels = 1000
silent! call setreg('"', '${c.reg}', 'v')
${c.setup ? `silent! call feedkeys("${vimKeys(c.setup)}", 'xt')` : ''}
try
  call feedkeys("${vimKeys(c.keys)}", 'xt')
catch
endtry
let s:st = {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1], 'reg': getreg('"'), 'regtype': getregtype('"')}
let s:changed = s:st.lines != ${lines}
if s:changed
  try
    call feedkeys("u", 'xt')
  catch
  endtry
  let s:st.undo = {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1]}
endif
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
    timeout: 300000,
  });
} catch (e) {
  console.error('vim run failed', e);
  process.exit(2);
}
const vimStates: State[] = JSON.parse(readFileSync(outFile, 'utf8'));
if (vimStates.length !== cases.length) {
  console.error(`vim produced ${vimStates.length}/${cases.length} states`);
  process.exit(2);
}

const regtype = (t: string): string => (t[0] === 'V' ? 'linewise' : t[0] === '\x16' ? 'blockwise' : 'charwise');
const samePos = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
const sameLines = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

const failures: { c: (typeof cases)[number]; vim: State; eng: State; fields: string[] }[] = [];
let engineErrors = 0;
for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const vim = { ...vimStates[i], regtype: regtype(vimStates[i].regtype) };
  let eng: State;
  try {
    const v = new Vim({ text: c.text, cursor: { line: c.cursor[0] - 1, col: c.cursor[1] }, strict: true });
    if (c.reg) v.registers.set('"', { text: c.reg, linewise: false, blockwise: false });
    if (c.setup) v.feedString(c.setup);
    v.feedString(c.keys);
    const r = v.registers.get('"');
    eng = {
      lines: v.buf.lines.slice(),
      cursor: [v.cursor.line + 1, v.cursor.col],
      reg: r?.text ?? '',
      regtype: r ? (r.blockwise ? 'blockwise' : r.linewise ? 'linewise' : 'charwise') : 'charwise',
    };
    if (!sameLines(vim.lines, eng.lines) || !samePos(vim.cursor, eng.cursor)) {
      // Only probe undo when Vim found a buffer change; a cursor-only command
      // must not undo the fixture.
      if (vim.undo) {
        v.feedString('u');
        eng.undo = { lines: v.buf.lines.slice(), cursor: [v.cursor.line + 1, v.cursor.col] };
      }
    } else if (vim.undo) {
      v.feedString('u');
      eng.undo = { lines: v.buf.lines.slice(), cursor: [v.cursor.line + 1, v.cursor.col] };
    }
  } catch (e) {
    engineErrors++;
    console.error(`ENGINE ERROR ${c.spec.cmd} count=${c.count}: ${e instanceof Error ? e.message : String(e)}`);
    continue;
  }
  const fields: string[] = [];
  if (!sameLines(vim.lines, eng.lines)) fields.push('buffer');
  if (!samePos(vim.cursor, eng.cursor)) fields.push('cursor');
  if (vim.reg !== eng.reg) fields.push('reg');
  if (vim.regtype !== eng.regtype) fields.push('regtype');
  if (vim.undo && (!eng.undo || !sameLines(vim.undo.lines, eng.undo.lines) || !samePos(vim.undo.cursor, eng.undo.cursor))) fields.push('undo');
  if (fields.length) failures.push({ c, vim, eng, fields });
}

const pass = cases.length - failures.length - engineErrors;
console.log(`count-matrix: ${pass}/${cases.length} matched; ${failures.length} divergences; ${engineErrors} engine errors`);
for (const f of failures.slice(0, SHOW)) {
  console.log(`\nFAIL ${f.c.spec.cmd} count=${f.c.count} keys=${JSON.stringify(f.c.keys)} fields=${f.fields.join(',')}`);
  console.log(`  text ${JSON.stringify(f.c.text)} @${f.c.cursor}`);
  console.log(`  vim  ${JSON.stringify(f.vim)}`);
  console.log(`  eng  ${JSON.stringify(f.eng)}`);
}
process.exit(failures.length || engineErrors ? 1 : 0);
