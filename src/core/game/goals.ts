import type { Goal } from './types.ts';
import type { Vim } from '../vim/engine.ts';

const normText = (t: string): string =>
  t
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');

const normLine = (l: string): string => l.replace(/[ \t]+$/, '');

export function collectPositions(text: string, ch: string): { line: number; col: number }[] {
  const out: { line: number; col: number }[] = [];
  text.split('\n').forEach((line, i) => {
    for (let j = 0; j < line.length; j++) if (line[j] === ch) out.push({ line: i, col: j });
  });
  return out;
}

export function checkGoal(goal: Goal, vim: Vim, collected?: Set<number>): boolean {
  switch (goal.type) {
    case 'reach':
      return vim.buf.line(vim.cursor.line)[vim.cursor.col] === goal.char;
    case 'exact':
      return normText(vim.buf.flat) === normText(goal.text);
    case 'lines': {
      for (let i = 0; i < goal.lines.length; i++) {
        const line = vim.buf.line(goal.from - 1 + i);
        if (normLine(line) !== normLine(goal.lines[i])) return false;
      }
      return true;
    }
    case 'none':
      return ![...goal.chars].some((c) => vim.buf.flat.includes(c));
    case 'cursor':
      return vim.cursor.line === goal.line && vim.cursor.col === goal.col;
    case 'collect': {
      if (!collected) return false;
      const positions = collectPositions(vim.buf.flat, goal.char);
      return positions.length > 0 && positions.every((p) => collected.has(p.line * 10000 + p.col));
    }
    case 'all':
      return goal.of.every((g) => checkGoal(g, vim, collected));
    default:
      return false;
  }
}

/** Human-readable objective for the HUD. */
export function goalLabel(goal: Goal, lang: 'ko' | 'en'): string {
  const ko = lang === 'ko';
  switch (goal.type) {
    case 'reach':
      return ko ? `${goal.char} 에 도달하라` : `Reach ${goal.char}`;
    case 'exact':
      return ko ? '문서를 복원하라' : 'Restore the text';
    case 'lines':
      return ko ? `${goal.from}번째 줄을 고쳐라` : `Fix line ${goal.from}`;
    case 'none':
      return ko ? `${goal.chars} 를 모두 지워라` : `Remove all ${goal.chars}`;
    case 'cursor':
      return ko ? '표시된 지점으로 이동하라' : 'Move to the mark';
    case 'collect':
      return ko ? `모든 ${goal.char} 를 모아라` : `Collect every ${goal.char}`;
    case 'all':
      return goal.of.map((g) => goalLabel(g, lang)).join(' + ');
    default:
      return '';
  }
}
