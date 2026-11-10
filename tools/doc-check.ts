/**
 * `npm run doc-check` — document integrity gate.
 *
 * Two things must never drift from the code, and this file makes the drift a
 * build failure instead of a surprise:
 *
 *   1. every "N/N" oracle count (and every "N keystroke cases") written in
 *      README.md / AGENTS.md / docs/*.md must equal `CASES.length`;
 *   2. every `docs/*.md` reference in those same files must resolve to a real
 *      file (catches dangling links like a promised-but-absent ARCHITECTURE.md).
 *
 * CI runs this on every push. The oracle itself (`tools/oracle-diff.ts`) needs
 * a real `vim` binary, which CI does not have; this static gate is the CI-safe
 * proxy for "the docs still match the code".
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { CASES } from './cases.ts';

const n = CASES.length;
const files = [
  'README.md',
  'AGENTS.md',
  ...readdirSync('docs')
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/${f}`),
];

let bad = 0;
const fail = (msg: string): void => {
  bad++;
  console.log('FAIL  ' + msg);
};

for (const f of files) {
  if (!existsSync(f)) continue;
  const t = readFileSync(f, 'utf8');

  // 1) "N/N" oracle counts (only self-referential pairs, e.g. 117/117)
  for (const m of t.matchAll(/\b(\d+)\/(\d+)\b/g)) {
    if (m[1] === m[2] && Number(m[1]) !== n) {
      fail(`${f}: "${m[0]}" should be ${n}/${n}`);
    }
  }

  // 2) "N keystroke cases" phrasing
  for (const m of t.matchAll(/\b(\d+)\s+keystroke\s+cases?\b/gi)) {
    if (Number(m[1]) !== n) {
      fail(`${f}: "${m[0]}" should say ${n} keystroke cases`);
    }
  }

  // 3) dangling docs/*.md links
  for (const m of t.matchAll(/\bdocs\/([A-Za-z0-9_-]+\.md)\b/g)) {
    if (!existsSync(m[0])) {
      fail(`${f}: dangling link ${m[0]}`);
    }
  }
}

console.log(`oracle cases: ${n}`);
if (bad) {
  console.log(`\n${bad} doc check(s) failed — update the docs or the code.`);
  process.exit(1);
}
console.log('doc check OK');
