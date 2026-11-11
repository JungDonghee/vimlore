/**
 * Surface audit — the machine-readable proof of what VIMLORE teaches.
 *
 *   node --experimental-strip-types tools/surface-audit.ts [--write] [--strict]
 *
 * Reads the Grimoire (commands.ts), the chapters, the oracle cases and the
 * TRIALS skills, maps every taught command to its evidence, and reports gaps:
 *
 *   - grimoire-only commands (no stage teaches them)
 *   - commands with no oracle case (heuristic match)
 *   - commands never used by a TRIALS skill
 *   - oracle cases that touch no command (orphans)
 *   - structural errors (unknown ids, duplicates, empty keys)
 *
 * `--write` regenerates docs/ENGINE_SURFACE.md. `--strict` also fails on gaps
 * (the ratchet for the ENGINE_PROGRAM phases); CI runs non-strict until the
 * surface is 100% covered.
 *
 * The matching is deliberately heuristic: a command is "touched" when its key
 * tokens appear in the case/trial/solution key stream. Insert-mode text can
 * over-match single-letter commands, so treat counts as *at least* evidence,
 * not a proof. Structural errors are exact.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { COMMANDS, type CommandInfo } from '../src/content/commands.ts';
import { CHAPTERS } from '../src/content/chapters/index.ts';
import { TRIAL_SKILLS } from '../src/core/game/trials.ts';
import { tokenize } from '../src/core/vim/keys.ts';
import { CASES } from './cases.ts';

type Matcher = (tokens: string[]) => boolean;

/** Contiguous token subsequence. */
function containsSeq(hay: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  if (needle.length === 1) return hay.includes(needle[0]);
  for (let i = 0; i + needle.length <= hay.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}

/** Command ids whose `keys` are examples, not literal key sequences. */
const ALIAS: Record<string, Matcher> = {
  count: (t) => t.some((k) => /^[1-9]$/.test(k)),
  ':s': (t) => t[0] === ':' && t.includes('s'),
  ':%s': (t) => t[0] === ':' && t.includes('%') && t.includes('s'),
  ':g': (t) => t[0] === ':' && t.includes('g'),
  ':d': (t) => t[0] === ':' && t.includes('d'),
  ':m': (t) => t[0] === ':' && t.includes('m'),
  ':t': (t) => t[0] === ':' && t.includes('t'),
  ':sort': (t) => t[0] === ':' && containsSeq(t, [':', 's', 'o', 'r', 't']),
  ':normal': (t) => t[0] === ':' && containsSeq(t, ['n', 'o', 'r', 'm', 'a', 'l']),
  // Single-key teaching aliases: match the key itself, not the example suffix.
  q: (t) => t.includes('q'),
  '@': (t) => t.includes('@'),
  m: (t) => t.includes('m'),
  "'": (t) => t.includes("'"),
  '"': (t) => t.includes('"'),
  esc: (t) => t.includes('<Esc>'),
  'C-o': (t) => t.includes('<C-o>'),
  'C-v': (t) => t.includes('<C-v>'),
};

function matcherFor(cmd: CommandInfo): Matcher {
  const alias = ALIAS[cmd.id];
  if (alias) return alias;
  const needle = tokenize(cmd.keys);
  return (tokens) => containsSeq(tokens, needle);
}

const caseTokens = CASES.map((c) => ({ name: c.name, tokens: tokenize(c.keys) }));
/**
 * Engine features that are in the game's surface but have no Grimoire row
 * (motions/operators used by stages or the engine, taught implicitly).
 * These are first-class surface entries: they need oracle/unit evidence too.
 */
interface EngineFeature {
  id: string;
  keys: string;
  match: Matcher;
}

const ENGINE_ONLY: EngineFeature[] = [
  { id: '^', keys: '^', match: (t) => t.includes('^') },
  { id: 'gg', keys: 'gg', match: (t) => containsSeq(t, ['g', 'g']) },
  { id: 'G', keys: 'G', match: (t) => t.includes('G') },
  { id: '(', keys: '(', match: (t) => t.includes('(') },
  { id: ')', keys: ')', match: (t) => t.includes(')') },
  { id: 'C-a', keys: '<C-a>', match: (t) => t.includes('<C-a>') },
  { id: 'C-x', keys: '<C-x>', match: (t) => t.includes('<C-x>') },
  { id: 'g#', keys: 'g#', match: (t) => containsSeq(t, ['g', '#']) },
  { id: '=', keys: '=', match: (t) => t.includes('=') },
];


/** Unit-test evidence: every `feedString('...')` in tests/vim.test.ts. */
const unitTokens: string[][] = [];
{
  const src = readFileSync(new URL('../tests/vim.test.ts', import.meta.url), 'utf8');
  for (const re of [/feedString\('([^']*)'\)/g, /feedString\("([^"]*)"\)/g]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) unitTokens.push(tokenize(m[1]));
  }
}

interface Row {
  cmd: CommandInfo;
  taughtBy: string[];
  solutions: string[];
  oracle: string[];
  unit: number;
  trials: string[];
}

const rows: Row[] = COMMANDS.map((cmd) => {
  const match = matcherFor(cmd);
  const taughtBy: string[] = [];
  const solutions: string[] = [];
  for (const ch of CHAPTERS) {
    for (const st of ch.stages) {
      if ((st.teaches ?? []).includes(cmd.id)) taughtBy.push(st.id);
      if (st.solution && match(tokenize(st.solution))) solutions.push(st.id);
    }
  }
  const oracle = caseTokens.filter((c) => match(c.tokens)).map((c) => c.name);
  const unit = unitTokens.filter((t) => match(t)).length;
  const trials = TRIAL_SKILLS.filter((s) => match(s.keys)).map((s) => s.id);
  return { cmd, taughtBy, solutions, oracle, unit, trials };
});

const structural: string[] = [];
const ids = new Set<string>();
for (const cmd of COMMANDS) {
  if (ids.has(cmd.id)) structural.push(`duplicate command id: ${cmd.id}`);
  ids.add(cmd.id);
  if (!cmd.keys) structural.push(`empty keys: ${cmd.id}`);
}
for (const ch of CHAPTERS) {
  for (const st of ch.stages) {
    for (const t of st.teaches ?? []) if (!ids.has(t)) structural.push(`${st.id} teaches unknown command: ${t}`);
  }
}

const engineRows = ENGINE_ONLY.map((f) => ({
  feat: f,
  oracle: caseTokens.filter((c) => f.match(c.tokens)).map((c) => c.name),
  unit: unitTokens.filter((t) => f.match(t)).length,
}));

const orphans = caseTokens.filter(
  (c) => !rows.some((r) => r.oracle.includes(c.name)) && !engineRows.some((r) => r.oracle.includes(c.name)),
);

const grimoireOnly = rows.filter((r) => r.taughtBy.length === 0);
const noOracle = rows.filter((r) => r.oracle.length === 0);
const noUnit = rows.filter((r) => r.unit === 0);
const noEvidence = rows.filter((r) => r.oracle.length === 0 && r.unit === 0);
const unitOnly = rows.filter((r) => r.oracle.length === 0 && r.unit > 0);
const noTrial = rows.filter((r) => r.trials.length === 0);
const noStageUse = rows.filter((r) => r.solutions.length === 0);
// Engine-completeness gaps: an in-scope command with no differential/unit
// evidence, an engine feature outside the Grimoire, or a structural error.
const gaps = structural.length + noEvidence.length + orphans.length;

const pct = (n: number) => (COMMANDS.length ? Math.round((n / COMMANDS.length) * 100) : 0);
const list = (xs: string[], max = 30) => (xs.length ? xs.slice(0, max).join(', ') + (xs.length > max ? `, +${xs.length - max}` : '') : '—');

function report(): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('VIMLORE — engine surface audit');
  lines.push('===============================');
  lines.push('');
  lines.push(`commands            ${COMMANDS.length}`);
  lines.push(`taught by a stage   ${COMMANDS.length - grimoireOnly.length} (${pct(COMMANDS.length - grimoireOnly.length)}%)`);
  lines.push(`oracle-touched      ${COMMANDS.length - noOracle.length} (${pct(COMMANDS.length - noOracle.length)}%)`);
  lines.push(`unit-touched        ${COMMANDS.length - noUnit.length} (${pct(COMMANDS.length - noUnit.length)}%)`);
  lines.push(`any engine evidence ${COMMANDS.length - noEvidence.length} (${pct(COMMANDS.length - noEvidence.length)}%)`);
  lines.push(`trial-used          ${COMMANDS.length - noTrial.length} (${pct(COMMANDS.length - noTrial.length)}%) — informational`);
  lines.push(`engine-only features ${ENGINE_ONLY.length}`);
  lines.push(`oracle cases        ${CASES.length}; orphan cases ${orphans.length}`);
  lines.push('');
  lines.push(`grimoire-only       ${grimoireOnly.length}: ${list(grimoireOnly.map((r) => r.cmd.id))}`);
  lines.push(`no oracle case      ${noOracle.length}: ${list(noOracle.map((r) => r.cmd.id))}`);
  lines.push(`unit-only           ${unitOnly.length}: ${list(unitOnly.map((r) => r.cmd.id))}`);
  lines.push(`NO ENGINE EVIDENCE  ${noEvidence.length}: ${list(noEvidence.map((r) => r.cmd.id))}`);
  lines.push(`no TRIALS skill     ${noTrial.length}: ${list(noTrial.map((r) => r.cmd.id))} (informational)`);
  lines.push(`no stage solution   ${noStageUse.length}: ${list(noStageUse.map((r) => r.cmd.id))} (curriculum)`);
  lines.push(`orphan cases        ${orphans.length}: ${list(orphans.map((c) => c.name), 20)}`);
  lines.push(`structural errors   ${structural.length}${structural.length ? ': ' + list(structural, 20) : ''}`);
  lines.push('');
  lines.push('engine-only features (no Grimoire row):');
  for (const r of engineRows) {
    lines.push(`  ${r.feat.id.padEnd(5)} oracle ${String(r.oracle.length).padStart(2)} · unit ${String(r.unit).padStart(2)}`);
  }
  lines.push('');
  for (let ch = 1; ch <= 10; ch++) {
    const rs = rows.filter((r) => r.cmd.chapter === ch);
    lines.push(`ch${String(ch).padStart(2, '0')}  ${String(rs.length).padStart(2)} commands · ${String(rs.filter((r) => r.taughtBy.length).length).padStart(2)} taught · ${String(rs.filter((r) => r.oracle.length).length).padStart(2)} oracle · ${String(rs.filter((r) => r.trials.length).length).padStart(2)} trials`);
  }
  lines.push('');
  return lines.join('\n');
}

function surfaceDoc(): string {
  const out: string[] = [];
  out.push('# ENGINE SURFACE — generated evidence map');
  out.push('');
  out.push('> Generated by `npm run surface -- --write`. Do not hand-edit.');
  out.push('> The manifest concept and the proof obligations are defined in');
  out.push('> [`ENGINE_PROGRAM.md`](ENGINE_PROGRAM.md). Matching is heuristic: a command');
  out.push('> is "touched" when its key tokens appear in the case/trial/solution stream.');
  out.push('');
  out.push('## Summary');
  out.push('');
  out.push('| metric | value |');
  out.push('|---|---|');
  out.push(`| commands | ${COMMANDS.length} |`);
  out.push(`| taught by a stage | ${COMMANDS.length - grimoireOnly.length} (${pct(COMMANDS.length - grimoireOnly.length)}%) |`);
  out.push(`| oracle-touched | ${COMMANDS.length - noOracle.length} (${pct(COMMANDS.length - noOracle.length)}%) |`);
  out.push(`| unit-touched | ${COMMANDS.length - noUnit.length} (${pct(COMMANDS.length - noUnit.length)}%) |`);
  out.push(`| any engine evidence | ${COMMANDS.length - noEvidence.length} (${pct(COMMANDS.length - noEvidence.length)}%) |`);
  out.push(`| trial-used (informational) | ${COMMANDS.length - noTrial.length} (${pct(COMMANDS.length - noTrial.length)}%) |`);
  out.push(`| oracle cases | ${CASES.length} |`);
  out.push(`| engine-only features | ${ENGINE_ONLY.length} |`);
  out.push(`| orphan oracle cases | ${orphans.length} |`);
  out.push(`| structural errors | ${structural.length} |`);
  out.push('');
  out.push('## Gaps');
  out.push('');
  out.push(`- **Grimoire-only** (no stage teaches): ${list(grimoireOnly.map((r) => `\`${r.cmd.id}\``))}`);
  out.push(`- **No oracle case**: ${list(noOracle.map((r) => `\`${r.cmd.id}\``))}`);
  out.push(`- **Unit-only (no oracle):** ${list(unitOnly.map((r) => `\`${r.cmd.id}\``))}`);
  out.push(`- **No engine evidence at all**: ${list(noEvidence.map((r) => `\`${r.cmd.id}\``))}`);
  out.push(`- **No TRIALS skill** (informational): ${list(noTrial.map((r) => `\`${r.cmd.id}\``))}`);
  out.push(`- **No stage solution uses it** (curriculum): ${list(noStageUse.map((r) => `\`${r.cmd.id}\``))}`);
  out.push(`- **Orphan oracle cases**: ${list(orphans.map((c) => `\`${c.name}\``), 40)}`);
  if (structural.length) out.push(`- **Structural errors**: ${list(structural, 40)}`);
  out.push('');
  out.push('## Engine-only features');
  out.push('');
  out.push('| id | keys | oracle | unit |');
  out.push('|---|---|---:|---:|');
  for (const r of engineRows) out.push(`| \`${r.feat.id}\` | \`${r.feat.keys}\` | ${r.oracle.length} | ${r.unit} |`);
  out.push('');
  out.push('## Commands');
  out.push('');
  out.push('| id | keys | ch | taught by | oracle | unit | trials |');
  out.push('|---|---|---:|---:|---:|---:|---:|');
  for (const r of rows) {
    out.push(`| \`${r.cmd.id}\` | \`${r.cmd.keys}\` | ${r.cmd.chapter} | ${r.taughtBy.length} | ${r.oracle.length} | ${r.unit} | ${r.trials.length} |`);
  }
  out.push('');
  return out.join('\n');
}

console.log(report());
const write = process.argv.includes('--write');
if (write) {
  writeFileSync('docs/ENGINE_SURFACE.md', surfaceDoc());
  console.log('wrote docs/ENGINE_SURFACE.md');
}

if (structural.length) {
  console.error(`surface audit: ${structural.length} structural error(s)`);
  process.exit(1);
}
if (process.argv.includes('--strict') && gaps > 0) {
  console.error(`surface audit --strict: ${gaps} gap(s) (surface is not 100% covered yet)`);
  process.exit(1);
}
