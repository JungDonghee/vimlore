/**
 * Normal-command capability manifest for the count matrix.
 *
 * Only commands that exist in Vim are listed. `count` means:
 *   yes      — `[count]` changes the result; counts 1,2,3 are differential-tested
 *   ignored  — Vim ignores the count; counts 1,2,3 are still tested to prove it
 *   no       — no count form is applicable
 *   deferred — Vim has a count but the engine/test matrix does not cover it yet
 *   approx   — implemented with a documented simplification
 *
 * The count matrix fails the build when a `yes`/`ignored` row has no case for
 * 1, 2 and 3.
 */
export type CountSupport = 'yes' | 'ignored' | 'no' | 'deferred' | 'approx';

export interface CountTest {
  /** Optional keys run before the counted command (same in Vim and engine). */
  setup?: string;
  /** Command invocation after the count prefix, e.g. `x`, `rZ`, `iZ<Esc>`. */
  keys: string;
  text?: string;
  cursor?: [number, number];
  /** Seed the unnamed register with charwise text before setup. */
  reg?: string;
}

export interface CommandSpec {
  /** Display label, e.g. `x`, `dd`, `<C-r>`. */
  cmd: string;
  count: CountSupport;
  register: boolean;
  repeat: boolean;
  undo: boolean;
  line: boolean;
  visual: boolean;
  note?: string;
  test?: CountTest;
}

const BASE = 'one two three\nfour five six\nseven eight nine';
const FIND = 'aXbXcXd';

const m = (cmd: string, test: CountTest, extra: Partial<CommandSpec> = {}): CommandSpec => ({
  cmd,
  count: 'yes',
  register: false,
  repeat: false,
  undo: false,
  line: false,
  visual: false,
  test,
  ...extra,
});

export const MANIFEST: CommandSpec[] = [
  m('h', { text: BASE, cursor: [1, 6], keys: 'h' }),
  m('j', { text: BASE, cursor: [1, 0], keys: 'j' }),
  m('k', { text: BASE, cursor: [2, 0], keys: 'k' }),
  m('l', { text: BASE, cursor: [1, 0], keys: 'l' }),
  m('w', { text: BASE, cursor: [1, 0], keys: 'w' }),
  m('W', { text: BASE, cursor: [1, 0], keys: 'W' }),
  m('e', { text: BASE, cursor: [1, 0], keys: 'e' }),
  m('E', { text: BASE, cursor: [1, 0], keys: 'E' }),
  m('b', { text: BASE, cursor: [1, 8], keys: 'b' }),
  m('B', { text: BASE, cursor: [1, 8], keys: 'B' }),
  m('0', { text: BASE, cursor: [1, 6], keys: '0' }, { count: 'ignored' }),
  m('^', { text: BASE, cursor: [1, 6], keys: '^' }, { count: 'ignored' }),
  m('$', { text: BASE, cursor: [1, 0], keys: '$' }),
  m('G', { text: BASE, cursor: [1, 0], keys: 'G' }),
  m('gg', { text: BASE, cursor: [2, 0], keys: 'gg' }),
  m('+', { text: BASE, cursor: [1, 0], keys: '+' }),
  m('-', { text: BASE, cursor: [2, 0], keys: '-' }),
  m('_', { text: BASE, cursor: [1, 0], keys: '_' }),
  m('f', { text: FIND, cursor: [1, 0], keys: 'fX' }),
  m('F', { text: FIND, cursor: [1, 6], keys: 'FX' }),
  m('t', { text: FIND, cursor: [1, 0], keys: 'tX' }),
  m('T', { text: FIND, cursor: [1, 6], keys: 'TX' }),
  m(';', { text: FIND, cursor: [1, 0], setup: 'fX', keys: ';' }),
  m(',', { text: FIND, cursor: [1, 0], setup: 'fX', keys: ',' }),
  m('%', { text: 'a(b(c)d)e', cursor: [1, 0], keys: '%' }),
  { cmd: 'H/M/L', count: 'approx', register: false, repeat: false, undo: false, line: false, visual: false, note: 'buffer top/middle/bottom, not viewport' },

  m('x', { text: 'abcdef', cursor: [1, 1], keys: 'x' }, { register: true, repeat: true, undo: true }),
  m('X', { text: 'abcdef', cursor: [1, 3], keys: 'X' }, { register: true, repeat: true, undo: true }),
  m('r', { text: 'abcdef', cursor: [1, 1], keys: 'rZ' }, { repeat: true, undo: true }),
  m('~', { text: 'abcdef', cursor: [1, 1], keys: '~' }, { repeat: true, undo: true }),
  m('J', { text: BASE, cursor: [1, 0], keys: 'J' }, { repeat: true, undo: true }),
  m('gJ', { text: BASE, cursor: [1, 0], keys: 'gJ' }, { repeat: true, undo: true }),
  m('d', { text: BASE, cursor: [1, 0], keys: 'd2w' }, { register: true, repeat: true, undo: true, visual: true }),
  m('dd', { text: BASE, cursor: [1, 0], keys: 'dd' }, { register: true, repeat: true, undo: true, line: true, visual: true }),
  m('D', { text: BASE, cursor: [1, 0], keys: 'D' }, { register: true, repeat: true, undo: true, visual: true }),
  m('c', { text: BASE, cursor: [1, 0], keys: 'c2wZ<Esc>' }, { register: true, repeat: true, undo: true, visual: true }),
  m('cc', { text: BASE, cursor: [1, 0], keys: 'ccZ<Esc>' }, { register: true, repeat: true, undo: true, line: true, visual: true }),
  m('C', { text: BASE, cursor: [1, 0], keys: 'CZ<Esc>' }, { register: true, repeat: true, undo: true, visual: true }),
  m('s', { text: 'abcdef', cursor: [1, 1], keys: 'sZ<Esc>' }, { register: true, repeat: true, undo: true, visual: true }),
  m('S', { text: BASE, cursor: [1, 0], keys: 'SZ<Esc>' }, { register: true, repeat: true, undo: true, line: true, visual: true }),
  m('y', { text: BASE, cursor: [1, 0], keys: 'y2w' }, { register: true, visual: true }),
  m('yy', { text: BASE, cursor: [1, 0], keys: 'yy' }, { register: true, line: true, visual: true }),
  m('Y', { text: BASE, cursor: [1, 0], keys: 'Y' }, { register: true, line: true, visual: true }),
  m('p', { text: BASE, cursor: [1, 1], keys: 'p', reg: 'Z' }, { register: true, repeat: true, undo: true, visual: true }),
  m('P', { text: BASE, cursor: [1, 1], keys: 'P', reg: 'Z' }, { register: true, repeat: true, undo: true, visual: true }),
  { cmd: '.', count: 'deferred', register: true, repeat: true, undo: true, line: false, visual: false, note: 'repeats change, but count undo-block/register grouping differs; fix pending' },
  m('u', { text: 'abcdef', cursor: [1, 0], setup: 'xxx', keys: 'u' }, { undo: true }),
  m('<C-r>', { text: 'abcdef', cursor: [1, 0], setup: 'xxx3u', keys: '<C-r>' }),
  m('>>', { text: BASE, cursor: [1, 0], keys: '>>' }, { repeat: true, undo: true, line: true, visual: true }),
  m('<<', { text: '  one two\n  four five', cursor: [1, 0], keys: '<<' }, { repeat: true, undo: true, line: true, visual: true }),
  m('i', { text: 'abc', cursor: [1, 0], keys: 'iZ<Esc>' }, { repeat: true, undo: true }),
  m('a', { text: 'abc', cursor: [1, 0], keys: 'aZ<Esc>' }, { repeat: true, undo: true }),
  m('I', { text: '  abc', cursor: [1, 2], keys: 'IZ<Esc>' }, { repeat: true, undo: true }),
  m('A', { text: 'abc', cursor: [1, 0], keys: 'AZ<Esc>' }, { repeat: true, undo: true }),
  m('o', { text: BASE, cursor: [1, 0], keys: 'oZ<Esc>' }, { repeat: true, undo: true, line: true }),
  m('O', { text: BASE, cursor: [1, 0], keys: 'OZ<Esc>' }, { repeat: true, undo: true, line: true }),

  { cmd: 'n', count: 'deferred', register: false, repeat: false, undo: false, line: false, visual: false, note: 'search repeat; count corpus pending' },
  { cmd: 'N', count: 'deferred', register: false, repeat: false, undo: false, line: false, visual: false, note: 'search repeat; count corpus pending' },
  { cmd: '* / #', count: 'deferred', register: false, repeat: false, undo: false, line: false, visual: false, note: 'search motions; count corpus pending' },
  { cmd: 'm / marks', count: 'no', register: false, repeat: false, undo: false, line: false, visual: false, note: 'marks implemented; :marks/:delmarks missing' },
  { cmd: 'q / @', count: 'deferred', register: true, repeat: false, undo: false, line: false, visual: false, note: 'macros implemented; @ count not in matrix yet' },
  { cmd: 'z / zt / zz / zb', count: 'no', register: false, repeat: false, undo: false, line: false, visual: false, note: 'viewport motions deferred (explicit no-op)' },
  { cmd: ':', count: 'no', register: false, repeat: false, undo: false, line: false, visual: false, note: 'ex commands have their own oracle' },
  { cmd: 'buffers/files', count: 'no', register: false, repeat: false, undo: false, line: false, visual: false, note: 'deferred; see FUTURE_EDITOR.md' },
];

export function countCases(): { spec: CommandSpec; count: number; keys: string; text: string; cursor: [number, number]; setup: string; reg: string }[] {
  const out = [];
  for (const spec of MANIFEST) {
    if (!spec.test || (spec.count !== 'yes' && spec.count !== 'ignored')) continue;
    for (const count of [1, 2, 3]) {
      out.push({
        spec,
        count,
        keys: `${count}${spec.test.keys}`,
        text: spec.test.text ?? BASE,
        cursor: spec.test.cursor ?? [1, 0],
        setup: spec.test.setup ?? '',
        reg: spec.test.reg ?? '',
      });
    }
  }
  return out;
}

export function manifestMarkdown(): string {
  const cell = (b: boolean): string => (b ? '✅' : '—');
  const count = (c: CountSupport): string => ({ yes: '✅', ignored: 'ignored', no: '—', deferred: 'deferred', approx: 'approx' })[c];
  const lines = [
    '# Command capability manifest',
    '',
    'Normal-command surface for the count matrix. `count` is `✅` (counts 1–3',
    'differential-tested), `ignored` (Vim ignores count; still tested), `—` (no',
    'count form), `deferred` (Vim has one, matrix not yet), or `approx`',
    '(implemented with a documented simplification). Only real Vim behavior is',
    'encoded; the matrix runs counts 1, 2 and 3 against `vim -u NONE`.',
    '',
    'CI fails if a `✅`/`ignored` row has no 1/2/3 case. Generated by',
    '`node --experimental-strip-types tools/count-matrix.ts --write`.',
    '',
    '| command | count | register | repeat | undo | line | visual | note |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const s of MANIFEST) {
    lines.push(`| \`${s.cmd}\` | ${count(s.count)} | ${cell(s.register)} | ${cell(s.repeat)} | ${cell(s.undo)} | ${cell(s.line)} | ${cell(s.visual)} | ${s.note ?? ''} |`);
  }
  lines.push('', `Rows: ${MANIFEST.length}. Counted rows: ${MANIFEST.filter((s) => s.count === 'yes' || s.count === 'ignored').length}.`, '');
  return lines.join('\n');
}
