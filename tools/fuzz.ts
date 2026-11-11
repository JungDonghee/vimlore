/**
 * Seeded differential fuzzer — finds engine divergences the hand-written
 * oracle cases miss.
 *
 *   node --experimental-strip-types tools/fuzz.ts [--n=1500] [--seed=7] [--verbose]
 *
 * Strategy: build random ASCII buffers and random *valid* normal-mode key
 * sequences from the implemented alphabet, run them through a real
 * `vim -u NONE -es` (one shared process, like the oracle) and through the
 * engine, then diff buffer + cursor. A failure is printed as a copy-pasteable
 * repro that can become a case in `tools/cases.ts`.
 *
 * This is a development tool, not part of CI (CI has no vim).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Vim } from '../src/core/vim/engine.ts';

interface Case {
  name: string;
  text: string;
  cursor: [number, number]; // 1-based line, 0-based col
  keys: string;
  cat: string;
}

const argv = process.argv.slice(2);
const num = (flag: string, fallback: number): number => {
  const hit = argv.find((a) => a.startsWith(`--${flag}=`));
  if (!hit) return fallback;
  const n = Number(hit.split('=')[1]);
  return Number.isFinite(n) ? n : fallback;
};
const N = Math.max(1, Math.floor(num('n', 1500)));
const SEED = Math.floor(num('seed', 7));
const VERBOSE = argv.includes('--verbose');

/** mulberry32 — small deterministic PRNG. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];
const chance = (p: number): boolean => rng() < p;
const int = (a: number, b: number): number => a + Math.floor(rng() * (b - a + 1));

const TEXTS = [
  'a b c',
  'foo bar baz',
  'foo.bar baz',
  'const x = (a + b);',
  'if (x) { y(); }',
  '"hello world"',
  'a\nb\nc\nd',
  'one two\nthree four',
  '  indented\nnormal',
  'a,b,c,d',
  'abc abc abc',
  'function f() {\n  return 1;\n}',
  '[1, 2, 3]',
  'x = "a"; y = "b";',
  'foo   bar',
  'a\n\nb\n\nc',
  'the end is nigh',
  '(a (b) c)',
  'one\ntwo\nthree\nfour\nfive',
  'AAAA bbbb CCCC',
] as const;

const SIMPLE = ['h', 'j', 'k', 'l', 'w', 'b', 'e', 'W', 'B', 'E', '0', '^', '$', 'gg', 'G', '{', '}', '(', ')'] as const;
const FINDS = ['f', 'F', 't', 'T'] as const;
const FIND_CHARS = ['a', 'b', 'c', ',', '.', '(', ')', '"', ' '] as const;
const OBJECTS = ['iw', 'aw', 'iW', 'aW', 'i"', 'a"', "i'", "a'", 'i(', 'a(', 'i[', 'a[', 'i{', 'a{', 'i<', 'a<', 'it', 'at', 'ip', 'ap'] as const;
const OPS = ['d', 'c', 'y', '>', '<', 'g~', 'gu', 'gU'] as const;
const VIS_OPS = ['d', 'y', '~', 'U', 'u', '>', '<'] as const;
const VIS_START = ['v', 'V', '<C-v>'] as const;
const INSERTS = ['i', 'a', 'I', 'A', 'o', 'O'] as const;

function count(): string {
  return chance(0.35) ? String(int(2, 3)) : '';
}

function motion(): string {
  if (chance(0.22)) return `${pick(FINDS)}${pick(FIND_CHARS)}`;
  return pick(SIMPLE);
}

function target(): string {
  return chance(0.45) ? pick(OBJECTS) : motion();
}

/** One normal-mode command, always balanced (inserts end with <Esc>). */
function command(): { keys: string; cat: string } {
  const roll = rng();
  if (roll < 0.20) return { keys: count() + motion(), cat: 'motion' };
  if (roll < 0.46) {
    const op = pick(OPS);
    const t = target();
    const body = op === 'c' ? `${op}${t}xy<Esc>` : `${op}${t}`;
    return { keys: count() + body, cat: 'operator' };
  }
  if (roll < 0.56) {
    const op = pick(['d', 'c', 'y', '>', '<', 'g~', 'gu', 'gU'] as const);
    const doubled = `g${op[1]}${op[1]}`;
    if (op.length === 1 && op !== 'c') return { keys: count() + op + op, cat: 'doubled' };
    if (op === 'c') return { keys: count() + 'ccXY<Esc>', cat: 'doubled' };
    void doubled;
    return { keys: count() + op + op.slice(-1), cat: 'doubled-g' };
  }
  if (roll < 0.68) {
    const simple = pick(['x', 'X', '~', 'J', 'gJ', 'p', 'P', '<C-a>', '<C-x>'] as const);
    return { keys: count() + simple, cat: 'simple' };
  }
  if (roll < 0.76) {
    return { keys: count() + 'r' + pick(FIND_CHARS.filter((c) => c !== ' ')), cat: 'replace' };
  }
  if (roll < 0.88) {
    const pre = pick(INSERTS);
    return { keys: pre + 'Xy<Esc>', cat: 'insert' };
  }
  // visual
  const start = pick(VIS_START);
  let body = start;
  const steps = int(1, 2);
  for (let i = 0; i < steps; i++) body += motion();
  if (chance(0.15)) {
    body += `${pick(['d', 'y', '~', '>', '<'] as const)}`;
  } else {
    body += `${pick(VIS_OPS)}`;
  }
  return { keys: body, cat: 'visual' };
}

function makeCase(i: number): Case {
  const text = pick(TEXTS);
  const lines = text.split('\n');
  const line = int(1, lines.length);
  const len = lines[line - 1].length;
  const col = len === 0 ? 0 : int(0, Math.max(0, len - 1));
  const parts: string[] = [];
  const cats: string[] = [];
  // One balanced command per case: `normal!` aborts at the first error, so
  // chaining commands would compare a truncated Vim run against a full engine
  // run. Single commands keep every divergence actionable.
  const c = command();
  parts.push(c.keys);
  cats.push(c.cat);
  return { name: `fuzz-${i}`, text, cursor: [line, col], keys: parts.join(''), cat: cats.join('+') };
}

// ---- real vim batch -------------------------------------------------------

function vimKeys(keys: string): string {
  return keys
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/<Esc>/g, '\\<Esc>')
    .replace(/<CR>/g, '\\<CR>')
    .replace(/<BS>/g, '\\<BS>')
    .replace(/<Tab>/g, '\\<Tab>')
    .replace(/<Space>/g, ' ')
    .replace(/<C-([a-z])>/g, '\\<C-$1>');
}

const cases: Case[] = Array.from({ length: N }, (_, i) => makeCase(i));
// Sentinel: a command that always succeeds in normal mode. If Vim's `normal!`
// hit an error it aborts the rest of the sequence, so the sentinel is missing
// from the Vim result — we skip those cases instead of reporting false bugs.
const SENTINEL = '<Esc>i!<Esc>';
for (const c of cases) c.keys += SENTINEL;

const dir = mkdtempSync(join(tmpdir(), 'vimlore-fuzz-'));
const outFile = join(dir, 'out.json');
const scriptFile = join(dir, 'run.vim');
const esc = (p: string): string => p.replace(/\\/g, '/');

let script = `set nocompatible
set shiftwidth=2
set noexpandtab
set noswapfile
let s:out = []
`;
cases.forEach((c) => {
  const lines = JSON.stringify(c.text.split('\n'));
  const [l, col] = c.cursor;
  script += `enew!
clearjumps
silent! %d _
call setline(1, ${lines})
call cursor(${l}, ${col + 1})
let &undolevels = -1
let &undolevels = 1000
silent! call setreg('"', '')
silent! call setreg('-', '')
let @/ = ''
let v:errmsg = ''
try
  execute "normal! ${vimKeys(c.keys)}"
catch
endtry
call add(s:out, {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1], 'err': v:errmsg})
`;
});
script += `call writefile([json_encode(s:out)], '${esc(outFile)}')
qa!
`;
writeFileSync(scriptFile, script);

try {
  execFileSync('vim', ['-N', '-u', 'NONE', '-i', 'NONE', '-es', '-S', scriptFile], {
    stdio: ['ignore', 'ignore', 'ignore'],
    timeout: 60000,
  });
} catch (e) {
  console.error('vim run failed', e);
  process.exit(2);
}
const expected: { lines: string[]; cursor: [number, number]; err: string }[] = JSON.parse(readFileSync(outFile, 'utf8'));
if (expected.length !== cases.length) {
  console.error(`vim produced ${expected.length}/${cases.length} results — a case broke the batch`);
  process.exit(2);
}

// ---- engine ---------------------------------------------------------------

function runEngine(c: Case): { lines: string[]; cursor: [number, number] } {
  const v = new Vim({ text: c.text, cursor: { line: c.cursor[0] - 1, col: c.cursor[1] } });
  v.feedString(c.keys);
  return { lines: v.buf.lines.slice(), cursor: [v.cursor.line + 1, v.cursor.col] };
}

/** Remove the sentinel `!` the case appended, so we compare the command itself. */
function stripSentinel(r: { lines: string[]; cursor: [number, number] }): { lines: string[]; cursor: [number, number] } | null {
  const [line, col] = r.cursor;
  const row = line - 1;
  if (r.lines[row]?.[col] !== '!') return null;
  const lines = r.lines.slice();
  lines[row] = lines[row].slice(0, col) + lines[row].slice(col + 1);
  return { lines, cursor: r.cursor };
}

let pass = 0;
let vimErrors = 0;
const failures: { c: Case; exp: { lines: string[]; cursor: [number, number] }; got: { lines: string[]; cursor: [number, number] } }[] = [];
cases.forEach((c, i) => {
  const rawExp = expected[i];
  const rawGot = runEngine(c);
  // Compare only the command's own effect: strip the sentinel `!` from both.
  const exp = stripSentinel(rawExp);
  const got = stripSentinel(rawGot);
  if (!exp || !got) {
    vimErrors++; // Vim (or the engine) aborted before the sentinel
    return;
  }
  const same = JSON.stringify(exp.lines) === JSON.stringify(got.lines) && exp.cursor[0] === got.cursor[0] && exp.cursor[1] === got.cursor[1];
  if (same) pass++;
  else failures.push({ c, exp, got });
});

console.log(`fuzz: ${pass}/${cases.length} matched; ${vimErrors} skipped (vim error); ${failures.length} divergences (seed ${SEED}, n ${N})`);
if (failures.length) {
  const byCat = new Map<string, number>();
  const content = failures.filter((f) => JSON.stringify(f.exp.lines) !== JSON.stringify(f.got.lines)).length;
  for (const f of failures) byCat.set(f.c.cat, (byCat.get(f.c.cat) ?? 0) + 1);
  console.log(`divergences: ${content} buffer-content, ${failures.length - content} cursor-only`);
  console.log('failures by category:', JSON.stringify(Object.fromEntries(byCat)));
  const shown = failures.slice(0, Number(process.env.FUZZ_SHOW ?? 12));
  for (const f of shown) {
    console.log(`\nFAIL ${f.c.name} [${f.c.cat}] keys=${JSON.stringify(f.c.keys)}`);
    console.log(`  text   ${JSON.stringify(f.c.text)} @${f.c.cursor}`);
    console.log(`  vim    ${JSON.stringify(f.exp.lines)} @${f.exp.cursor}`);
    console.log(`  engine ${JSON.stringify(f.got.lines)} @${f.got.cursor}`);
  }
  if (VERBOSE) {
    for (const f of failures) {
      console.log(`FAIL ${f.c.name} | ${JSON.stringify(f.c.text)} | ${f.c.cursor} | ${f.c.keys}`);
    }
  }
  const repro = join(tmpdir(), `vimlore-fuzz-failures-${SEED}.txt`);
  writeFileSync(repro, failures.map((f) => `${f.c.name} | content=${JSON.stringify(f.exp.lines) !== JSON.stringify(f.got.lines) ? 1 : 0} | ${JSON.stringify(f.c.text)} | ${JSON.stringify(f.c.cursor)} | ${f.c.keys} | cat=${f.c.cat}`).join('\n') + '\n');
  console.log(`\n${failures.length} failures; repro list: ${repro}`);
  process.exit(1);
}
