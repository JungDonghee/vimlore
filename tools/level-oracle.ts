/**
 * Level-state oracle: replay every stage's exact solution in real Vim and in
 * the engine, then compare final buffer, cursor and unnamed register.
 *
 * This is the game-specific companion to state-matrix: it proves the keystrokes
 * each level actually ships behave like Vim on the level's own text.
 *
 *   npm run level-oracle -- [--stage=c01s1] [--undo] [--dump] [--write]
 *
 * `--write` regenerates docs/GAME_USED_STATE.md (undo is diagnostic; failure of
 * the undo diagnostic does not fail the command).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CHAPTERS } from '../src/content/chapters/index.ts';
import { Session, parseStart } from '../src/core/game/session.ts';
import { stageUnlockKeys } from '../src/content/commands.ts';
import { vimKeys } from './matrix-cases.ts';
import { tokenize } from '../src/core/vim/keys.ts';

const WRITE = process.argv.includes('--write');
const CHECK_UNDO = process.argv.includes('--undo') || WRITE;

interface Out { stage: string; lines: string[]; cursor: [number, number]; reg: string; regtype: string; undo: { lines: string[]; cursor: [number, number]; reg: string; regtype: string } }
const STAGE_FILTER = (process.argv.find((a) => a.startsWith('--stage='))?.split('=')[1] ?? '');
const stages = CHAPTERS.flatMap((ch) => ch.stages.map((st) => ({ ch, st }))).filter((x) => x.st.solution && (!STAGE_FILTER || x.st.id === STAGE_FILTER));
const dir = mkdtempSync(join(tmpdir(), 'vimlore-level-'));
const outFile = join(dir, 'out.json');
const scriptFile = join(dir, 'run.vim');
const esc = (p: string) => p.replace(/\\/g, '/');
let script = `set nocompatible\nset shiftwidth=2\nset expandtab\nset textwidth=72\nlet s:out = []\n`;
for (const { ch, st } of stages) {
  const start = parseStart(st.text, st.startChar);
  const lines = JSON.stringify(start.text.split('\n'));
  script += `enew!
clearjumps
silent! %d _
call setline(1, ${lines})
set textwidth=${st.textwidth ?? 40}
call cursor(${start.line + 1}, ${start.col + 1})
let &undolevels = -1
let &undolevels = 1000
silent! call setreg('"', '')
let @/ = ''
try
  call feedkeys("${vimKeys(st.solution!)}", 'xt')
catch
endtry
let s:st = {'stage': '${st.id}', 'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1], 'reg': getreg('"'), 'regtype': getregtype('"')}
try
  call feedkeys("u", 'xt')
catch
endtry
let s:st.undo = {'lines': getline(1, '$'), 'cursor': [line('.'), col('.') - 1], 'reg': getreg('"'), 'regtype': getregtype('"')}
call add(s:out, s:st)
`;
}
script += `call writefile([json_encode(s:out)], '${esc(outFile)}')\nqa!\n`;
writeFileSync(scriptFile, script);
if (process.argv.includes('--dump')) writeFileSync('/tmp/level-oracle.vim', script);
try {
  execFileSync('vim', ['-N', '-u', 'NONE', '-i', 'NONE', '-es', '-S', scriptFile], { stdio: ['ignore', 'ignore', 'ignore'], timeout: 600000 });
} catch (e) {
  console.error('vim level oracle failed', e);
  process.exit(2);
}
const vimResults: Out[] = JSON.parse(readFileSync(outFile, 'utf8'));
const typeOf = (t: string) => (t[0] === 'V' ? 'linewise' : t[0] === '\x16' ? 'blockwise' : 'charwise');
let bad = 0;
const rows: { stage: string; solution: boolean; undo: boolean | null; fields: string[] }[] = [];
for (let i = 0; i < stages.length; i++) {
  const { ch, st } = stages[i];
  const s = new Session({ stage: st, chapterIndex: ch.index - 1, allowed: stageUnlockKeys(CHAPTERS, ch.index - 1, ch.stages.indexOf(st)) });
  for (const k of st.solution!.match(/<[^>]+>|./gsu) ?? []) {
    if (!s.feed(k)) break;
  }
  const v = vimResults[i];
  const vr = { lines: v.lines, cursor: [v.cursor[0], v.cursor[1]] as [number, number], reg: v.reg, regtype: typeOf(v.regtype) };
  const er = { lines: s.vim.buf.lines, cursor: [s.vim.cursor.line + 1, s.vim.cursor.col] as [number, number], reg: s.vim.registers.get('"')?.text ?? '', regtype: s.vim.registers.get('"')?.blockwise ? 'blockwise' : s.vim.registers.get('"')?.linewise ? 'linewise' : 'charwise' };
  const vu = { lines: v.undo.lines, cursor: [v.undo.cursor[0], v.undo.cursor[1]] as [number, number], reg: v.undo.reg, regtype: typeOf(v.undo.regtype) };
  if (CHECK_UNDO) s.vim.feedString('u');
  const eu = { lines: s.vim.buf.lines, cursor: [s.vim.cursor.line + 1, s.vim.cursor.col] as [number, number], reg: s.vim.registers.get('"')?.text ?? '', regtype: s.vim.registers.get('"')?.blockwise ? 'blockwise' : s.vim.registers.get('"')?.linewise ? 'linewise' : 'charwise' };
  const fields: string[] = [];
  if (JSON.stringify(vr.lines) !== JSON.stringify(er.lines)) fields.push('buffer');
  if (vr.cursor[0] !== er.cursor[0] || vr.cursor[1] !== er.cursor[1]) fields.push('cursor');
  if (vr.reg !== er.reg) fields.push('reg');
  if (vr.regtype !== er.regtype) fields.push('regtype');
  const engineStart = parseStart(st.text, st.startChar).text.split('\n');
  const changedAtAll = JSON.stringify(v.lines) !== JSON.stringify(engineStart);
  if (CHECK_UNDO && changedAtAll) {
    if (JSON.stringify(vu.lines) !== JSON.stringify(eu.lines)) fields.push('undo-buffer');
    if (vu.cursor[0] !== eu.cursor[0] || vu.cursor[1] !== eu.cursor[1]) fields.push('undo-cursor');
    if (vu.reg !== eu.reg) fields.push('undo-reg');
    if (vu.regtype !== eu.regtype) fields.push('undo-regtype');
  }
  const solutionBad = fields.some((f) => !f.startsWith('undo-'));
  const undoBad = fields.some((f) => f.startsWith('undo-'));
  rows.push({ stage: st.id, solution: !solutionBad, undo: CHECK_UNDO ? !undoBad : null, fields });
  if (fields.length) {
    if (solutionBad) bad++;
    console.log(`FAIL ${st.id} fields=${fields.join(',')}`);
    console.log(`  vim ${JSON.stringify(vr)} undo=${JSON.stringify(vu)}`);
    console.log(`  eng ${JSON.stringify(er)} undo=${JSON.stringify(eu)}`);
  }
}
console.log(`level-oracle: ${stages.length - bad}/${stages.length} stages match real Vim (solution${CHECK_UNDO ? ' + undo diagnostic' : ''})`);
if (WRITE) {
  const solutionOk = rows.filter((r) => r.solution).length;
  const undoOk = rows.filter((r) => r.undo === true).length;
  const md = [
    '# Game-used state matrix',
    '',
    '> Generated by `npm run level-oracle -- --write`. Every row replays the exact',
    '> shipped stage solution in real Vim and the engine. Undo is a diagnostic,',
    '> not a CI gate; solution mismatch is the gate.',
    '',
    `- stages: ${rows.length}`,
    `- solution matched: ${solutionOk}/${rows.length}`,
    `- solution+undo matched: ${undoOk}/${rows.length}`,
    '',
    '| stage | solution | solution+undo | fields |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.stage} | ${r.solution ? 'ok' : 'FAIL'} | ${r.undo === null ? '—' : r.undo ? 'ok' : 'FAIL'} | ${r.fields.join(', ') || '—'} |`),
    '',
    '## Remaining diagnostic rows',
    '',
    ...rows.filter((r) => r.undo === false).map((r) => `- ${r.stage}: ${r.fields.filter((f) => f.startsWith('undo-')).join(', ')}`),
    '',
  ];
  writeFileSync('docs/GAME_USED_STATE.md', md.join('\n'));
  console.log('wrote docs/GAME_USED_STATE.md');
}
process.exit(bad ? 1 : 0);
