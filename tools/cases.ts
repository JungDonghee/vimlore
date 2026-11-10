/**
 * Shared differential-test corpus.
 *
 * Each case is fed to both our engine and a real `vim -u NONE`, and the
 * resulting buffer + cursor must match. Cases are written the way a player
 * would type: `dw`, `ci"foo<Esc>`, `2jdd`, etc.
 */
export interface VimCase {
  name: string;
  text: string;
  cursor?: [number, number]; // 1-based line, 0-based col
  keys: string;
}

export const CASES: VimCase[] = [
  // --- basic motions -------------------------------------------------------
  { name: 'l x3', text: 'abcdef', cursor: [1, 0], keys: '3l' },
  { name: 'h', text: 'abcdef', cursor: [1, 4], keys: 'h' },
  { name: 'j keeps column', text: 'abcdef\nabcd\nabcdef', cursor: [1, 4], keys: 'jj' },
  { name: 'w', text: 'foo bar baz', cursor: [1, 0], keys: 'w' },
  { name: 'ww', text: 'foo bar baz', cursor: [1, 0], keys: '2w' },
  { name: 'w across lines', text: 'foo bar\nbaz qux', cursor: [1, 4], keys: 'w' },
  { name: 'e', text: 'foo bar baz', cursor: [1, 0], keys: 'e' },
  { name: 'ee', text: 'foo bar baz', cursor: [1, 0], keys: '2e' },
  { name: 'b', text: 'foo bar baz', cursor: [1, 8], keys: 'b' },
  { name: 'bb', text: 'foo bar baz', cursor: [1, 8], keys: '2b' },
  { name: 'W', text: 'foo.bar baz', cursor: [1, 0], keys: 'W' },
  { name: 'ge', text: 'foo bar baz', cursor: [1, 6], keys: 'ge' },
  { name: '0', text: '   abc', cursor: [1, 5], keys: '0' },
  { name: '^', text: '   abc', cursor: [1, 5], keys: '^' },
  { name: '$', text: 'abc def', cursor: [1, 0], keys: '$' },
  { name: 'gg', text: 'a\nb\nc\nd', cursor: [4, 0], keys: 'gg' },
  { name: 'G', text: 'a\nb\nc\nd', cursor: [1, 0], keys: 'G' },
  { name: '2G', text: 'a\nb\nc\nd', cursor: [1, 0], keys: '2G' },
  { name: 'f', text: 'abc,def,ghi', cursor: [1, 0], keys: 'f,' },
  { name: '2f', text: 'abc,def,ghi', cursor: [1, 0], keys: '2f,' },
  { name: 't', text: 'abc,def', cursor: [1, 0], keys: 't,' },
  { name: 'F', text: 'abc,def', cursor: [1, 6], keys: 'F,' },
  { name: 'T', text: 'abc,def', cursor: [1, 6], keys: 'T,' },
  { name: ';', text: 'a,b,c,d', cursor: [1, 0], keys: 'f,;' },
  { name: 'percent', text: 'if (a(b)c) end', cursor: [1, 0], keys: '%' },
  { name: ')', text: 'One. Two. Three.', cursor: [1, 0], keys: ')' },
  { name: '}', text: 'a\nb\n\nc\nd', cursor: [1, 0], keys: '}' },

  // --- operators -----------------------------------------------------------
  { name: 'dw', text: 'foo bar baz', cursor: [1, 0], keys: 'dw' },
  { name: '2dw', text: 'foo bar baz', cursor: [1, 0], keys: '2dw' },
  { name: 'd2w', text: 'foo bar baz', cursor: [1, 0], keys: 'd2w' },
  { name: 'de', text: 'foo bar', cursor: [1, 0], keys: 'de' },
  { name: 'db', text: 'foo bar', cursor: [1, 4], keys: 'db' },
  { name: 'd$', text: 'foo bar', cursor: [1, 4], keys: 'd$' },
  { name: 'd0', text: 'foo bar', cursor: [1, 4], keys: 'd0' },
  { name: 'dd', text: 'a\nb\nc', cursor: [2, 0], keys: 'dd' },
  { name: '2dd', text: 'a\nb\nc\nd', cursor: [1, 0], keys: '2dd' },
  { name: 'dj', text: 'a\nb\nc', cursor: [1, 0], keys: 'dj' },
  { name: 'dk', text: 'a\nb\nc', cursor: [3, 0], keys: 'dk' },
  { name: 'dw at eol', text: 'foo bar\nbaz', cursor: [1, 4], keys: 'dw' },
  { name: 'dw last word', text: 'foo bar\nbaz', cursor: [1, 4], keys: 'dw' },
  { name: 'df,', text: 'abc,def', cursor: [1, 0], keys: 'df,' },
  { name: 'dt,', text: 'abc,def', cursor: [1, 0], keys: 'dt,' },
  { name: 'd}', text: 'a\nb\n\nc', cursor: [1, 0], keys: 'd}' },
  { name: 'cw', text: 'foo bar', cursor: [1, 0], keys: 'cwX<Esc>' },
  { name: 'c$', text: 'foo bar', cursor: [1, 4], keys: 'c$X<Esc>' },
  { name: 'cc', text: 'foo\nbar', cursor: [1, 0], keys: 'ccX<Esc>' },
  { name: 'x', text: 'abc', cursor: [1, 1], keys: 'x' },
  { name: '3x', text: 'abcdef', cursor: [1, 0], keys: '3x' },
  { name: 'X', text: 'abc', cursor: [1, 2], keys: 'X' },
  { name: 'D', text: 'foo bar', cursor: [1, 4], keys: 'D' },
  { name: 'C', text: 'foo bar', cursor: [1, 4], keys: 'CX<Esc>' },
  { name: 'yy p', text: 'a\nb', cursor: [1, 0], keys: 'yyp' },
  { name: 'yy P', text: 'a\nb', cursor: [2, 0], keys: 'yyP' },
  { name: 'yw P', text: 'foo bar', cursor: [1, 0], keys: 'ywP' },
  { name: 'dw p', text: 'foo bar', cursor: [1, 0], keys: 'dwp' },
  { name: 'dd p', text: 'a\nb\nc', cursor: [1, 0], keys: 'ddp' },
  { name: 'x p', text: 'abc', cursor: [1, 0], keys: 'xp' },
  { name: '~', text: 'abc', cursor: [1, 0], keys: '~' },
  { name: 'r', text: 'abc', cursor: [1, 0], keys: 'rX' },
  { name: '2r', text: 'abcd', cursor: [1, 0], keys: '2rX' },
  { name: 'J', text: 'foo\nbar', cursor: [1, 0], keys: 'J' },
  { name: 'gJ', text: 'foo\nbar', cursor: [1, 0], keys: 'gJ' },
  { name: '>>', text: 'foo\nbar', cursor: [1, 0], keys: '>>' },
  { name: '<<', text: '  foo', cursor: [1, 0], keys: '<<' },
  { name: 'gu', text: 'FOO bar', cursor: [1, 0], keys: 'guw' },
  { name: 'gU', text: 'foo bar', cursor: [1, 0], keys: 'gUw' },
  { name: 'g~', text: 'foo bar', cursor: [1, 0], keys: 'g~w' },

  // --- text objects --------------------------------------------------------
  { name: 'diw', text: 'foo bar baz', cursor: [1, 5], keys: 'diw' },
  { name: 'daw', text: 'foo bar baz', cursor: [1, 5], keys: 'daw' },
  { name: 'ciw', text: 'foo bar baz', cursor: [1, 5], keys: 'ciwX<Esc>' },
  { name: 'daw last', text: 'foo bar', cursor: [1, 5], keys: 'daw' },
  { name: 'di(', text: 'f(a, b) g', cursor: [1, 3], keys: 'di(' },
  { name: 'da(', text: 'f(a, b) g', cursor: [1, 3], keys: 'da(' },
  { name: 'di"', text: 'say "hi there" ok', cursor: [1, 7], keys: 'di"' },
  { name: 'da"', text: 'say "hi there" ok', cursor: [1, 7], keys: 'da"' },
  { name: 'ci"', text: 'say "hi there" ok', cursor: [1, 7], keys: 'ci"yo<Esc>' },
  { name: 'dip', text: 'a\nb\n\nc', cursor: [1, 0], keys: 'dip' },
  { name: 'dit', text: '<p>hello</p>', cursor: [1, 5], keys: 'dit' },

  // --- insert --------------------------------------------------------------
  { name: 'i', text: 'abc', cursor: [1, 1], keys: 'iX<Esc>' },
  { name: 'a', text: 'abc', cursor: [1, 1], keys: 'aX<Esc>' },
  { name: 'A', text: 'abc', cursor: [1, 0], keys: 'AX<Esc>' },
  { name: 'I', text: '   abc', cursor: [1, 5], keys: 'IX<Esc>' },
  { name: 'o', text: 'abc', cursor: [1, 0], keys: 'oX<Esc>' },
  { name: 'O', text: 'abc', cursor: [1, 0], keys: 'OX<Esc>' },
  { name: 'a newline', text: 'abc', cursor: [1, 0], keys: 'A<CR>X<Esc>' },
  { name: 'backspace joins', text: 'ab\ncd', cursor: [2, 0], keys: 'i<BS><Esc>' },
  { name: 's', text: 'abc', cursor: [1, 1], keys: 'sX<Esc>' },

  // --- undo / dot ----------------------------------------------------------
  { name: 'u after x', text: 'abc', cursor: [1, 0], keys: 'xu' },
  { name: 'u after insert', text: 'abc', cursor: [1, 0], keys: 'iXY<Esc>u' },
  { name: 'dot x', text: 'abcdef', cursor: [1, 0], keys: 'x.' },
  { name: 'dot dw', text: 'a b c d', cursor: [1, 0], keys: 'dw.' },
  { name: 'dot i', text: 'abc', cursor: [1, 0], keys: 'iX<Esc>l.' },
  { name: 'dot cw', text: 'aa bb cc', cursor: [1, 0], keys: 'cwX<Esc>w.' },

  // --- visual --------------------------------------------------------------
  { name: 'v d', text: 'abcdef', cursor: [1, 0], keys: 'vlld' },
  { name: 'V d', text: 'a\nb\nc', cursor: [1, 0], keys: 'Vjd' },
  { name: 'v y p', text: 'abc', cursor: [1, 0], keys: 'vly$p' },
  { name: 'V >', text: 'a\nb', cursor: [1, 0], keys: 'Vj>' },
  { name: 'v U', text: 'abc', cursor: [1, 0], keys: 'vllU' },

  // --- search --------------------------------------------------------------
  { name: '/ search', text: 'foo bar\nbaz bar', cursor: [1, 0], keys: '/bar<CR>' },
  { name: 'n', text: 'a x b x c x', cursor: [1, 0], keys: '/x<CR>n' },
  { name: '*', text: 'foo bar foo', cursor: [1, 0], keys: '*' },
  { name: 'd/search', text: 'a\nb\ntarget', cursor: [1, 0], keys: 'd/target<CR>' },

  // (ex commands are covered by tests/vim.test.ts; they cannot run through :normal in -es)
];
