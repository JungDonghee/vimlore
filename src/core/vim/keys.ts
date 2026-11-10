/**
 * Key notation.
 *
 * The engine consumes a stream of *keys*, where a key is either a single
 * character ("a", "3", "✧") or a special token ("<Esc>", "<CR>", "<C-w>").
 * Level solutions are written as readable strings and tokenized here.
 */

export const ESC = '<Esc>';
export const CR = '<CR>';
export const BS = '<BS>';
export const TAB = '<Tab>';
export const SPACE = '<Space>';
export const CTRL_W = '<C-w>';
export const CTRL_R = '<C-r>';
export const CTRL_U = '<C-u>';

const SPECIAL = new Set([
  'Esc', 'CR', 'BS', 'Tab', 'Space', 'NL', 'lt', 'Bar', 'Del', 'Up', 'Down', 'Left', 'Right', 'Home', 'End', 'BS',
]);

/** Tokenize a key string such as "ci\"new<Esc>" or "<C-w>w". */
export function tokenize(keys: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < keys.length) {
    const ch = keys[i];
    if (ch === '<') {
      const close = keys.indexOf('>', i + 1);
      if (close > i + 1) {
        const body = keys.slice(i + 1, close);
        if (SPECIAL.has(body) || /^[CSAM]-[A-Za-z0-9<>-]$/.test(body) || body === 'C-[' || body === 'C-]' || body === 'C-^' || body === 'C-\\') {
          out.push('<' + body + '>');
          i = close + 1;
          continue;
        }
      }
    }
    out.push(ch);
    i++;
  }
  return out;
}

export function isSpecialKey(key: string): boolean {
  return key.length > 1 && key.startsWith('<') && key.endsWith('>');
}

/** Human-readable label for the HUD, e.g. <C-w> -> ^W */
export function keyLabel(key: string): string {
  if (!isSpecialKey(key)) return key === ' ' ? '␣' : key;
  return key.replace(/^<C-(.)>$/, '^$1').replace(/^<(.+)>$/, '⟨$1⟩');
}

export function normalizeKey(key: string): string {
  switch (key) {
    case 'Escape':
      return ESC;
    case 'Enter':
      return CR;
    case 'Backspace':
      return BS;
    case 'Tab':
      return TAB;
    case ' ':
      return SPACE;
    default:
      return key.length === 1 ? key : key;
  }
}

/** Map a DOM KeyboardEvent to an engine key token (or null if ignored). */
export function fromKeyboardEvent(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }): string | null {
  if (e.metaKey) return null;
  const k = e.key;
  if (e.ctrlKey && !e.altKey) {
    if (k.length === 1 && /[a-zA-Z@\[\\\]^_]/.test(k)) {
      const c = k.toUpperCase();
      if (c === '[') return ESC;
      return `<C-${c.toLowerCase()}>`;
    }
    if (k === '[') return ESC;
    return null;
  }
  if (k === 'Escape') return ESC;
  if (k === 'Enter') return CR;
  if (k === 'Backspace') return BS;
  if (k === 'Tab') return TAB;
  if (k === 'Delete') return '<Del>';
  if (k.length === 1) return k === ' ' ? SPACE : k;
  return null;
}
