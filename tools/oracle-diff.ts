/**
 * Differential oracle: run every case through the real Vim binary and through
 * our engine, then diff the resulting buffer + cursor.
 *
 *   node --experimental-strip-types tools/oracle-diff.ts [--verbose]
 *
 * Development tool, not part of CI (CI has no vim). Run it whenever you touch
 * motions/operators: it is the cheapest way to keep the engine honest.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CASES } from './cases.ts';
import { Vim } from '../src/core/vim/engine.ts';

interface Result {
  lines: string[];
  cursor: [number, number];
}

/** Escape a game key string into a Vim double-quoted string body. */
function vimKeys(keys: string): string {
  return keys
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/<Esc>/g, '\\<Esc>')
    .replace(/<CR>/g, '\\<CR>')
    .replace(/<BS>/g, '\\<BS>')
    .replace(/<Tab>/g, '\\<Tab>')
    .replace(/<Space>/g, ' ');
}

const dir = mkdtempSync(join(tmpdir(), 'vimlore-oracle-'));
const outFile = join(dir, 'out.json');
const scriptFile = join(dir, 'run.vim');
const esc = (p: string) => p.replace(/\\/g, '/');

let script = `set nocompatible
set shiftwidth=2
set noexpandtab
let s:out = []
`;
CASES.forEach((c, i) => {
  const lines = JSON.stringify(c.text.split('\n'));
  const [l, col] = c.cursor ?? [1, 0];
  script += `enew!
call setline(1, ${lines})
call cursor(${l}, ${col + 1})
let s:ul = &undolevels
set undolevels=-1
let &undolevels = s:ul
try
  execute "normal! ${vimKeys(c.keys)}"
catch
endtry
call add(s:out, {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1]})
`;
});
script += `call writefile([json_encode(s:out)], '${esc(outFile)}')
qa!
`;

writeFileSync(scriptFile, script);

try {
  execFileSync('vim', ['-N', '-u', 'NONE', '-i', 'NONE', '-es', '-S', scriptFile], {
    stdio: ['ignore', 'ignore', 'ignore'],
    timeout: 30000,
  });
} catch (e) {
  console.error('vim run failed', e);
  process.exit(1);
}

const expected: Result[] = JSON.parse(readFileSync(outFile, 'utf8'));
if (process.argv.includes('--emit')) {
  const { writeFileSync: wf } = await import('node:fs');
  wf('tests/vim-expected.json', JSON.stringify(expected, null, 0) + '\n');
  console.log(`emitted tests/vim-expected.json (${expected.length} cases)`);
  process.exit(0);
}
const verbose = process.argv.includes('--verbose');

function runEngine(c: (typeof CASES)[number]): Result {
  const v = new Vim({ text: c.text, cursor: { line: (c.cursor?.[0] ?? 1) - 1, col: c.cursor?.[1] ?? 0 } });
  v.feedString(c.keys);
  return { lines: v.buf.lines.slice(), cursor: [v.cursor.line + 1, v.cursor.col] };
}

let pass = 0;
const failures: string[] = [];
CASES.forEach((c, i) => {
  const exp = expected[i];
  const got = runEngine(c);
  const sameLines = JSON.stringify(exp.lines) === JSON.stringify(got.lines);
  const sameCursor = exp.cursor[0] === got.cursor[0] && exp.cursor[1] === got.cursor[1];
  if (sameLines && sameCursor) {
    pass++;
    if (verbose) console.log(`ok  ${c.name}`);
  } else {
    failures.push(
      `FAIL ${c.name}  keys=${JSON.stringify(c.keys)}\n  vim:    ${JSON.stringify(exp.lines)} @${exp.cursor}\n  engine: ${JSON.stringify(got.lines)} @${got.cursor}`,
    );
  }
});

console.log(`\n${pass}/${CASES.length} matching real Vim`);
if (failures.length) {
  console.log(failures.join('\n'));
  process.exit(1);
}
