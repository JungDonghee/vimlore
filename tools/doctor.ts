/**
 * `npm run doctor` — one command that tells a brand-new agent where it is and
 * what to do next. No context from a previous chat required.
 */
import { existsSync, readdirSync } from 'node:fs';

const line = (b: boolean, label: string, hint: string): void => console.log(`${b ? 'PASS' : 'MISS'}  ${label}${b ? '' : `  →  ${hint}`}`);
const count = (dir: string, ext: string): number => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).length : 0);

console.log('\nVIMLORE — environment check\n');
line(Number(process.versions.node.split('.')[0]) >= 20, `node ${process.versions.node}`, 'install Node 20+');
line(existsSync('node_modules/vite'), 'dependencies installed', 'npm ci');
line(existsSync('src/core/vim/engine.ts'), 'repo root looks right', 'cd into the vimlore checkout');
line(existsSync('dist/vimlore.html'), 'build exists', 'npm run build');
line(count('books-text', '.txt') >= 10, `reference books extracted (${count('books-text', '.txt')}/10)`, 'put the PDFs/EPUBs in ./books/, then: PYTHONPATH=./pysite python3 tools/extract_books.py (needs pypdf)');
line(existsSync('/home/jung/ai_station/sandbox/.secrets/github_token'), 'deploy token present', 'ask the human; it lives outside the repo');

console.log(`
NEXT
  1. read AGENTS.md            (invariants, voice, known gaps, shipping)
  2. read docs/LEVEL_FORMAT.md (how to add a stage)
  3. npm test                  (engine fidelity + trials)
  4. npm run lint:levels       (all 51 stages must be green)
  5. npm run dev               (play at http://localhost:5173)

RULES THAT ARE NOT NEGOTIABLE
  · the engine must keep matching real Vim  (tools/oracle-diff.ts)
  · every level must pass lint:levels       (par, gating, win on last key)
  · no server, no secrets in the repo, no runtime dependencies
`);
