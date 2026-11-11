/**
 * Prefix-state differential trace.
 *
 *   npm run trace -- --case=m-1234
 *   npm run trace -- --text="foo bar" --cursor=1,2 --keys="d3w"
 *
 * Runs a key sequence through real Vim and the engine, but captures state
 * after every token prefix, not just at the end. The first prefix where
 * buffer/cursor/register diverge is the bug's birth, which is much easier to
 * reason about than the final state of a long sequence.
 *
 * `--case` selects a generated matrix case (see tools/matrix-cases.ts);
 * otherwise use `--text`, optional `--cursor=line,col`, and `--keys`.
 * `--all` prints every prefix state. Exit 1 on divergence.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Vim } from '../src/core/vim/engine.ts';
import { tokenize } from '../src/core/vim/keys.ts';
import { makeCases, vimKeys } from './matrix-cases.ts';

interface State {
  lines: string[];
  cursor: [number, number];
  reg: string;
  regtype: string;
}

const argv = process.argv.slice(2);
const arg = (name: string): string | undefined => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const CASE = arg('case');
const ALL = argv.includes('--all');

let text = arg('text')?.replace(/\\n/g, '\n') ?? '';
let keys = arg('keys') ?? '';
let cursor: [number, number] = [1, 1];
const cursorArg = arg('cursor');
if (cursorArg) {
  const [l, c] = cursorArg.split(',').map(Number);
  cursor = [l || 1, c || 0];
}
let label = 'ad-hoc';
if (CASE) {
  const c = makeCases().find((x) => x.name === CASE);
  if (!c) {
    console.error(`no generated case named ${CASE}`);
    process.exit(2);
  }
  text = c.text;
  keys = c.keys;
  cursor = c.cursor;
  label = `${c.name} [${c.cat}]`;
}
if (!keys) {
  console.error('usage: npm run trace -- --case=m-1234 | --text="..." --cursor=1,2 --keys="..."');
  process.exit(2);
}

const toks = tokenize(keys);
const prefixes = [''];
for (let i = 0; i < toks.length; i++) prefixes.push(prefixes[i] + toks[i]);

const esc = (p: string) => p.replace(/\\/g, '/');
const dir = mkdtempSync(join(tmpdir(), 'vimlore-trace-'));
const outFile = join(dir, 'out.json');
const scriptFile = join(dir, 'run.vim');

let script = `set nocompatible
set shiftwidth=2
set expandtab
set textwidth=72
let s:out = []
`;
for (const prefix of prefixes) {
  const lines = JSON.stringify(text.split('\n'));
  script += `enew!
clearjumps
silent! call setcharsearch({'char': '', 'forward': 1, 'until': 0})
silent! %d _
call setline(1, ${lines})
call cursor(${cursor[0]}, ${cursor[1] + 1})
let &undolevels = -1
let &undolevels = 1000
silent! call setreg('"', '')
try
  call feedkeys("${vimKeys(prefix)}", 'xt')
catch
endtry
call add(s:out, {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1], 'reg': getreg('"'), 'regtype': getregtype('"')})
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
if (vimStates.length !== prefixes.length) {
  console.error(`vim produced ${vimStates.length}/${prefixes.length} states`);
  process.exit(2);
}

const regtype = (t: string): string => (t[0] === 'V' ? 'linewise' : t[0] === '\x16' ? 'blockwise' : 'charwise');
const norm = (s: State): State => ({ ...s, regtype: regtype(s.regtype) });
const samePos = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
const sameLines = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

console.log(`trace ${label}`);
console.log(`  text ${JSON.stringify(text)} @${cursor[0]},${cursor[1]}  keys=${JSON.stringify(keys)}  (${prefixes.length} prefixes)`);

let diverged = false;
for (let i = 0; i < prefixes.length; i++) {
  const vim = norm(vimStates[i]);
  let eng: State;
  try {
    const v = new Vim({ text, cursor: { line: cursor[0] - 1, col: cursor[1] }, strict: true });
    v.feedString(prefixes[i]);
    const r = v.registers.get('"');
    eng = {
      lines: v.buf.lines.slice(),
      cursor: [v.cursor.line + 1, v.cursor.col],
      reg: r?.text ?? '',
      regtype: r ? (r.blockwise ? 'blockwise' : r.linewise ? 'linewise' : 'charwise') : 'charwise',
    };
  } catch (e) {
    console.log(`\nprefix ${i} ${JSON.stringify(prefixes[i])}: ENGINE ERROR ${e instanceof Error ? e.message : String(e)}`);
    diverged = true;
    break;
  }
  const fields: string[] = [];
  if (!sameLines(vim.lines, eng.lines)) fields.push('buffer');
  if (!samePos(vim.cursor, eng.cursor)) fields.push('cursor');
  if (vim.reg !== eng.reg) fields.push('reg');
  if (vim.regtype !== eng.regtype) fields.push('regtype');
  if (fields.length) {
    console.log(`\nFIRST DIVERGENCE at prefix ${i} ${JSON.stringify(prefixes[i])} fields=${fields.join(',')}`);
    console.log(`  vim ${JSON.stringify(vim)}`);
    console.log(`  eng ${JSON.stringify(eng)}`);
    diverged = true;
    break;
  }
  if (ALL) console.log(`  prefix ${String(i).padStart(2)} ${JSON.stringify(prefixes[i]).padEnd(24)} ok`);
}
if (!diverged) console.log(`  all ${prefixes.length} prefixes match`);
process.exit(diverged ? 1 : 0);
