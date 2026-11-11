/**
 * Print the one-message kickoff with the current commit/date filled in.
 * The message is intentionally self-contained; docs hold the full detail.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
const source = readFileSync(new URL('../docs/ONE_MESSAGE.md', import.meta.url), 'utf8');
const block = /```text\n([\s\S]*?)```/.exec(source)?.[1];
if (!block) throw new Error('kickoff block not found in docs/ONE_MESSAGE.md');
const msg = block
  .replace('/home/jung/ai_station/sandbox/vimlore', '/home/jung/ai_station/sandbox/vimlore')
  .replace('HEAD 20a1c3a', `HEAD ${head}`);
console.log(`# VIMLORE kickoff — ${branch}@${head} — ${new Date().toISOString().slice(0, 10)}`);
console.log(msg);
