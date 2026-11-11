/**
 * Shared case generator and Vim key escaping for the matrix/state-matrix
 * tools. Kept separate so both harnesses diff the same command trees.
 */

export interface MCase {
  name: string;
  text: string;
  cursor: [number, number];
  keys: string;
  cat: string;
}

const TEXTS = [
  'one two three',
  'foo bar\nbaz qux',
  'a\n\nb\n\nc',
  '  indented\nnormal',
  'say "hi" there',
  'if (x) {\n  y();\n}',
  '[1, 2, 3]',
  '<p>hello</p>',
] as const;

const MOTIONS = [
  'h', 'j', 'k', 'l', 'w', 'W', 'b', 'B', 'e', 'E', '0', '^', '$',
  'gg', 'G', '{', '}', '(', ')', '%', 'fa', 'Fa', 'ta', 'Ta', ';', ',',
] as const;

const OBJECTS = [
  'iw', 'aw', 'iW', 'aW', 'i"', 'a"', "i'", "a'", 'i(', 'a(', 'i[', 'a[',
  'i{', 'a{', 'i<', 'a<', 'it', 'at', 'ip', 'ap',
] as const;

const OPS = ['d', 'c', 'y', '>', '<', 'g~', 'gu', 'gU'] as const;
const DOUBLED = ['dd', 'cc', 'yy', '>>', '<<', 'g~~', 'guu', 'gUU'] as const;
const COUNTS = ['', '2'] as const;

const VIS_MOTIONS: Record<string, string[]> = {
  v: ['w', 'b', 'e', '$', '0', 'j', 'k', 'G', 'gg', '}', '{', '%'],
  V: ['j', 'k', 'G', 'gg', '}'],
  '<C-v>': ['w', 'b', 'e', '$', 'j', 'k', 'G'],
};
const VIS_OPS = ['d', 'y', '>', '<', '~', 'U', 'u', 'c'] as const;

function cursorsFor(text: string): [number, number][] {
  const lines = text.split('\n');
  const last = lines.length;
  const out: [number, number][] = [
    [1, 0],
    [1, Math.min(2, Math.max(0, lines[0].length - 1))],
    [last, Math.min(1, Math.max(0, lines[last - 1].length - 1))],
  ];
  const seen = new Set<string>();
  return out.filter(([l, c]) => {
    const k = `${l}:${c}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function makeCases(): MCase[] {
  const cases: MCase[] = [];
  let i = 0;
  const push = (text: string, cursor: [number, number], keys: string, cat: string) => {
    cases.push({ name: `m-${i++}`, text, cursor, keys, cat });
  };
  const change = (op: string, keys: string) => (op === 'c' ? keys + 'X<Esc>' : keys);

  for (const text of TEXTS) {
    for (const cursor of cursorsFor(text)) {
      for (const count of COUNTS) {
        for (const op of OPS) {
          for (const motion of MOTIONS) {
            push(text, cursor, change(op, count + op + motion), `normal/${op}/motion/${motion}`);
          }
          for (const obj of OBJECTS) {
            push(text, cursor, change(op, count + op + obj), `normal/${op}/object/${obj}`);
          }
        }
        for (const dbl of DOUBLED) {
          push(text, cursor, change(dbl.startsWith('cc') ? 'c' : '', count + dbl), `normal/doubled/${dbl}`);
        }
      }
      for (const [mode, motions] of Object.entries(VIS_MOTIONS)) {
        for (const motion of motions) {
          for (const op of VIS_OPS) {
            push(text, cursor, change(op, `${mode}${motion}${op}`), `visual/${mode}/${op}/${motion}`);
          }
        }
      }
    }
  }
  return cases;
}

/** Escape a game key string into a Vim double-quoted string body. */
export function vimKeys(keys: string): string {
  return keys
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/<Esc>/g, '\\<Esc>')
    .replace(/<CR>/g, '\\<CR>')
    .replace(/<BS>/g, '\\<BS>')
    .replace(/<Tab>/g, '\\<Tab>')
    .replace(/<Space>/g, ' ')
    .replace(/<C-([a-z])>/g, '\\<C-$1>');
}
