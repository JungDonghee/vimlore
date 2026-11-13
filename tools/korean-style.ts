/**
 * Korean register gate: VIMLORE/KIRITSU is plain/banmal only.
 * This is a lexical check; nuance is still a human review.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const files: string[] = [];
function walk(path: string): void {
  for (const name of readdirSync(path)) {
    if (name.startsWith('.') || name === 'node_modules' || name === 'dist') continue;
    const p = join(path, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|md|js)$/.test(name)) files.push(p);
  }
}
walk(join(root, 'src'));
walk(join(root, 'docs', 'story'));
files.push(join(root, 'public', 'pwa.js'));

const bad = /(습니다|입니다|합니다|됩니다|드립니다|아닙니다|십시오|세요|해요|주세요|하십시오|까요|네요|어요|아요|시다|하시|드시|보시|가시|오시|계시|주시)/;
const hits: { file: string; line: number; text: string }[] = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!/[\uac00-\ud7af]/.test(line)) return;
    if (bad.test(line)) hits.push({ file: file.slice(root.length + 1), line: i + 1, text: line.trim().slice(0, 180) });
  });
}
if (hits.length) {
  console.error(`korean:check failed — ${hits.length} non-plain Korean line(s)`);
  for (const h of hits.slice(0, 40)) console.error(` - ${h.file}:${h.line} ${h.text}`);
  process.exit(1);
}
console.log(`korean: ${files.length} files scanned; plain/banmal only`);
