import type { Vim } from './engine.ts';
import { compilePattern } from './search.ts';

/**
 * Ex commands.
 *
 * The game only needs a focused subset, but it is a *real* subset: ranges,
 * :s with flags, :g/:v, :normal, :sort, :m/:t. Anything unsupported reports a
 * friendly message instead of failing silently.
 */

interface ParsedRange {
  l1: number;
  l2: number;
  explicit: boolean;
}

const RANGE_CHARS = /^[%.,;$0-9'<>\-+;\s]*/;

function parseRange(vim: Vim, input: string): { range: ParsedRange | null; rest: string } {
  const m = RANGE_CHARS.exec(input);
  const spec = (m?.[0] ?? '').trim();
  const rest = input.slice(m?.[0]?.length ?? 0);
  if (!spec) return { range: null, rest };
  const last = vim.buf.lineCount - 1;
  const toLine = (tok: string): number | null => {
    tok = tok.trim();
    if (tok === '') return null;
    if (tok === '.') return vim.cursor.line;
    if (tok === '$') return last;
    if (tok === '%') return 0;
    if (/^\d+$/.test(tok)) return Math.max(0, Math.min(last, parseInt(tok, 10) - 1));
    if (tok.startsWith("'")) {
      const name = tok[1];
      const mark = vim.marks.get(name);
      if (!mark) return null;
      return mark.line;
    }
    return null;
  };
  let l1: number;
  let l2: number;
  if (spec === '%') {
    l1 = 0;
    l2 = last;
  } else {
    const parts = spec.split(',');
    if (parts.length === 1) {
      const one = toLine(parts[0]);
      if (one === null) return { range: null, rest };
      l1 = one;
      l2 = one;
    } else {
      const a = toLine(parts[0]);
      const b = toLine(parts[1] ?? '');
      l1 = a ?? (b ?? vim.cursor.line);
      l2 = b ?? a ?? vim.cursor.line;
    }
  }
  if (l1 > l2) [l1, l2] = [l2, l1];
  return { range: { l1, l2, explicit: true }, rest };
}

function parseSubstituteArgs(rest: string): { pat: string; rep: string; flags: string } | null {
  if (!rest) return null;
  const delim = rest[0];
  if (/[a-zA-Z0-9\s]/.test(delim)) return null;
  let i = 1;
  let pat = '';
  while (i < rest.length && rest[i] !== delim) {
    if (rest[i] === '\\' && i + 1 < rest.length) {
      pat += rest[i] + rest[i + 1];
      i += 2;
    } else {
      pat += rest[i++];
    }
  }
  if (i >= rest.length) return null;
  i++;
  let rep = '';
  while (i < rest.length && rest[i] !== delim) {
    if (rest[i] === '\\' && i + 1 < rest.length) {
      rep += rest[i] + rest[i + 1];
      i += 2;
    } else {
      rep += rest[i++];
    }
  }
  const flags = i < rest.length ? rest.slice(i + 1).trim() : '';
  return { pat, rep, flags };
}

export function executeEx(vim: Vim, input: string): void {
  const raw = input.trim();
  if (!raw) return;
  if (/^\d+$/.test(raw)) {
    vim.gotoLine(parseInt(raw, 10));
    return;
  }
  const { range, rest } = parseRange(vim, raw);
  const cmd = rest.replace(/^\s*/, '');
  if (!cmd) {
    if (range) vim.gotoLine(range.l2 + 1);
    return;
  }

  if (cmd.startsWith('s') && (cmd.length === 1 || /[^a-zA-Z]/.test(cmd[1]) || cmd[1] === undefined)) {
    const args = cmd.length > 1 ? parseSubstituteArgs(cmd.slice(1)) : null;
    const l1 = range?.l1 ?? vim.cursor.line;
    const l2 = range?.l2 ?? vim.cursor.line;
    if (!args) {
      vim.echo('E486: pattern not found', 'error');
      return;
    }
    vim.exSubstitute(l1, l2, args.pat, args.rep, args.flags);
    return;
  }

  if (cmd.startsWith('g') || cmd.startsWith('v')) {
    const invert = cmd.startsWith('v') || cmd.startsWith('g!') || cmd.startsWith('g/!');
    const body = cmd.startsWith('g!') ? cmd.slice(2) : cmd.slice(1);
    const m = /^(.)(.*?)\1(.*)$/.exec(body);
    if (!m) {
      vim.echo('E492: not an editor command', 'error');
      return;
    }
    const pat = m[2];
    const sub = (m[3] ?? '').trim() || 'p';
    vim.exGlobal(pat, sub, invert);
    return;
  }

  // Commands may be glued to their argument in Vim (`:1m5`, `:sort!`, `:2t4`).
  const CMDS = ['nohlsearch', 'relativenumber', 'nonumber', 'nohlsearch', 'normal', 'sort', 'copy', 'noh', 'norm', 'set', 'wq', 'co', 'd', 'm', 't', 'w', 'x', 'q'];
  let name = '';
  let arg = '';
  for (const k of CMDS) {
    if (cmd === k || cmd.startsWith(k)) {
      name = k;
      arg = cmd.slice(k.length).trim();
      break;
    }
  }

  switch (name) {
    case 'd':
      vim.exDeleteLines(range?.l1 ?? vim.cursor.line, range?.l2 ?? vim.cursor.line);
      return;
    case 'm':
      vim.exMoveLines(range?.l1 ?? vim.cursor.line, range?.l2 ?? vim.cursor.line, parseInt(arg, 10) - 1);
      return;
    case 't':
    case 'co':
    case 'copy':
      vim.exCopyLines(range?.l1 ?? vim.cursor.line, range?.l2 ?? vim.cursor.line, parseInt(arg, 10) - 1);
      return;
    case 'normal':
    case 'norm':
      vim.exNormal(range?.l1 ?? vim.cursor.line, range?.l2 ?? vim.cursor.line, arg);
      return;
    case 'sort':
      vim.exSort(range?.l1 ?? 0, range?.l2 ?? vim.buf.lineCount - 1, arg);
      return;
    case 'set': {
      for (const opt of arg.split(/\s+/).filter(Boolean)) {
        if (opt === 'number' || opt === 'nu') vim.number = true;
        else if (opt === 'nonumber' || opt === 'nonu') vim.number = false;
        else if (opt === 'relativenumber' || opt === 'rnu') vim.relativenumber = true;
        else if (opt === 'norelativenumber' || opt === 'nornu') vim.relativenumber = false;
      }
      return;
    }
    case 'noh':
    case 'nohlsearch':
      vim.echo('search highlight cleared', 'info');
      return;
    case 'w':
    case 'wq':
    case 'x':
    case 'q':
      vim.echo(name === 'w' ? 'written' : 'written and closed', 'good');
      return;
    case '&':
      vim.exSubstitute(range?.l1 ?? vim.cursor.line, range?.l2 ?? vim.cursor.line, '', '', '&');
      return;
    default:
      vim.echo(`E492: not an editor command: ${name}`, 'error');
  }
}

export { parseSubstituteArgs, parseRange, compilePattern };
