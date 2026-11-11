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

  // --- jumplist / sentences ---
  { name: 'C-o back after G', text: 'a\nb\nc\nd', cursor: [1, 0], keys: 'G<C-o>' },
  { name: 'C-o C-i round trip', text: 'a\nb\nc\nd', cursor: [1, 0], keys: 'G<C-o><C-i>' },
  { name: 'sentence back', text: 'One. Two. Three.', cursor: [1, 17], keys: '(' },
  { name: 'sentence back mid', text: 'One. Two. Three.', cursor: [1, 12], keys: '(' },
  { name: 'sentence forward', text: 'One. Two. Three.', cursor: [1, 0], keys: ')' },

  // --- insert-mode extras / cmdline history ---
  { name: 'insert C-r register', text: 'foo bar', cursor: [1, 0], keys: 'yiwA<C-r>"<Esc>' },
  { name: 'insert C-o one command', text: 'ab cd', cursor: [1, 0], keys: 'i<C-o>wX<Esc>' },
  { name: 'insert C-o then insert', text: 'one two', cursor: [1, 0], keys: 'A<C-o>0Ifoo<Esc>' },

  // --- numbers ---
  { name: 'C-a', text: 'x = 41', cursor: [1, 0], keys: '<C-a>' },
  { name: 'C-a count', text: 'x = 41', cursor: [1, 0], keys: '3<C-a>' },
  { name: 'C-x', text: 'x = 41', cursor: [1, 0], keys: '<C-x>' },
  { name: 'C-a carry', text: 'n = 99', cursor: [1, 0], keys: '<C-a>' },
  { name: 'C-a octal', text: 'id 007', cursor: [1, 3], keys: '<C-a>' },
  { name: 'C-a hex', text: 'mask 0x1f', cursor: [1, 0], keys: '<C-a>' },
  { name: 'C-a plain number', text: 'count 41', cursor: [1, 0], keys: '<C-a>' },

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
  { name: 'd2G count', text: 'a\nb\nc\nd', cursor: [1, 0], keys: 'd2G' },
  { name: 'd2$ linewise', text: 'foo\nbar\nbaz', cursor: [1, 0], keys: 'd2$' },
  { name: 'd2w last word', text: 'baz qux', cursor: [1, 0], keys: 'd2w' },
  { name: 'cit empty tag', text: '<p></p>', cursor: [1, 2], keys: 'cit' },
  { name: 'insert CR newline', text: 'ab', cursor: [1, 1], keys: 'i<CR>X<Esc>' },
  { name: 'guu doubled', text: 'ABC', cursor: [1, 0], keys: 'guu' },
  { name: 'gUU doubled', text: 'abc', cursor: [1, 0], keys: 'gUU' },
  { name: 'di( on close paren', text: 'f(a, b) g', cursor: [1, 6], keys: 'di(' },
  { name: 'di{ on inner close', text: '{a{b}c}', cursor: [1, 4], keys: 'di{' },

  // (jumplist cases are excluded: the shared vim process leaks its jump list
  //  between cases, so <C-o>/<C-i> cannot be diffed reliably here. Engine
  //  jumplist behaviour is verified manually against a single vim process.)

  // --- visual-block ----------------------------------------------------------
  { name: 'v-block d', text: 'abcd\nefgh', cursor: [1, 0], keys: '<C-v>ljd' },
  { name: 'v-block yP', text: 'abcd\nefgh', cursor: [1, 0], keys: '<C-v>jyP' },

  // --- operator-pending motions (+ - _ |) -----------------------------------
  { name: 'd2+', text: 'a\nb\nc\nd', cursor: [1, 0], keys: 'd2+' },
  { name: 'd2|', text: 'abcdef', cursor: [1, 0], keys: 'd2|' },
  { name: 'dl last char', text: 'abc', cursor: [1, 2], keys: 'dl' },
  { name: 'daw on space', text: 'foo   bar', cursor: [1, 4], keys: 'daw' },
  { name: 'da" trailing spaces', text: 'say "hi"   ok', cursor: [1, 6], keys: 'da"' },
  { name: 'di" adjacent quotes', text: 'say ""x""', cursor: [1, 6], keys: 'di"' },
  { name: 'dip on blank line', text: 'a\nb\n\nc\nd', cursor: [3, 0], keys: 'dip' },
  { name: 'dap on blank line', text: 'a\nb\n\nc\nd', cursor: [3, 0], keys: 'dap' },
  { name: 'search \\c flag', text: 'bar FOO', cursor: [1, 0], keys: '/foo\\c<CR>' },
  { name: 'search \\C flag', text: 'Cfoo', cursor: [1, 0], keys: '/foo\\C<CR>' },
  { name: ':2m0', text: 'a\nb\nc', cursor: [1, 0], keys: ':2m0<CR>' },
  { name: ':2t0', text: 'a\nb\nc', cursor: [1, 0], keys: ':2t0<CR>' },
  { name: 'd2}', text: 'a\nb\n\nc\nd', cursor: [1, 0], keys: 'd2}' },
  { name: 'd2{', text: 'a\nb\n\nc\nd', cursor: [5, 0], keys: 'd2{' },

  // --- fuzz-discovered: operator ranges (G, gg, doubled ops) ----------------
  { name: 'g~G from last line', text: 'one two\nthree four', cursor: [2, 2], keys: 'g~G' },
  { name: 'cG to end', text: 'function f() {\n  return 1;\n}', cursor: [1, 6], keys: 'cGxy<Esc>' },
  { name: 'VG> current line', text: 'function f() {\n  return 1;\n}', cursor: [3, 0], keys: 'VG>' },
  { name: '2>gg', text: 'a\n\nb\n\nc', cursor: [2, 0], keys: '2>gg' },
  { name: '3>> at eof', text: 'one\ntwo\nthree\nfour\nfive', cursor: [4, 3], keys: '3>>' },
  { name: '3g~~ count', text: 'a\nb\nc\nd', cursor: [3, 0], keys: '3g~~' },
  { name: '2J empty line', text: 'a\n\nb\n\nc', cursor: [4, 0], keys: '2J' },
  { name: 'J empty line', text: 'a\n\nb', cursor: [2, 0], keys: 'J' },

  // --- fuzz-discovered: paragraph motions in operator range -----------------
  { name: 'g~{ same line', text: 'x = "a"; y = "b";', cursor: [1, 14], keys: 'g~{' },
  { name: 'd{ same line', text: 'x = "a"; y = "b";', cursor: [1, 14], keys: 'd{' },
  { name: '{ at bof', text: 'x = "a"; y = "b";', cursor: [1, 14], keys: '{' },
  { name: 'd} midline to eof', text: 'one two\nthree four', cursor: [1, 6], keys: 'd}' },
  { name: '} at eof', text: 'one two\nthree four', cursor: [2, 6], keys: '}' },
  { name: 'd} midline paragraph', text: 'one two\nthree four\n\nfive', cursor: [1, 6], keys: 'd}' },
  { name: 'd{ midline paragraph', text: 'one two\nthree four\n\nfive', cursor: [4, 6], keys: 'd{' },
  { name: 'vB{d', text: 'foo bar baz', cursor: [1, 7], keys: 'vB{d' },

  // --- fuzz-discovered: visual g-pending + sentence range at EOF -------------
  { name: 'VlggU', text: 'foo bar baz', cursor: [1, 2], keys: 'VlggU' },
  { name: 'vgg)U', text: 'the end is nigh', cursor: [1, 7], keys: 'vgg)U' },
  { name: 'c) at eof', text: 'foo.bar baz', cursor: [1, 8], keys: 'c)xy<Esc>' },
  { name: 'd) at eof', text: 'foo.bar baz', cursor: [1, 8], keys: 'd)' },
  { name: 'd) to next sentence', text: 'One. Two. Three.', cursor: [1, 0], keys: 'd)' },

  // --- fuzz-discovered: word motions stop on empty lines ---------------------
  { name: 'w over blank line', text: 'a\n\nb\n\nc', cursor: [1, 0], keys: 'w' },
  { name: '2w over blank lines', text: 'a\n\nb\n\nc', cursor: [1, 0], keys: '2w' },
  { name: 'b to blank line', text: 'a\n\nb\n\nc', cursor: [5, 0], keys: 'b' },
  { name: '2b over blank lines', text: 'a\n\nb\n\nc', cursor: [5, 0], keys: '2b' },
  { name: 'ge to blank line', text: 'a\n\nb', cursor: [3, 0], keys: 'ge' },
  { name: 'g~B blank lines', text: 'a\n\nb\n\nc', cursor: [5, 0], keys: 'g~B' },
  { name: 'E skips blank line', text: 'a\n\nb', cursor: [1, 0], keys: 'E' },

  // --- fuzz-discovered: visual-block / visual find --------------------------
  { name: 'v0tb~', text: 'a,b,c,d', cursor: [1, 4], keys: 'v0tb~' },
  { name: 'v-block ~', text: 'one\ntwo\nthree\nfour\nfive', cursor: [5, 2], keys: '<C-v>{~' },
  { name: 'v-block >', text: 'if (x) { y(); }', cursor: [1, 9], keys: '<C-v>t(>' },
  { name: 'v-block $hd', text: 'a,b,c,d', cursor: [1, 0], keys: '<C-v>$hd' },

  // --- fuzz-discovered: cursor placement of yank / case / join --------------
  { name: 'yy keeps column', text: 'the end is nigh', cursor: [1, 8], keys: 'yy' },
  { name: '2yy keeps column', text: '  indented\nnormal', cursor: [1, 3], keys: '2yy' },
  { name: '3yG backward', text: 'one\ntwo\nthree\nfour\nfive', cursor: [4, 2], keys: '3yG' },
  { name: 'yk top of range', text: 'a\nb\nc\nd', cursor: [3, 1], keys: 'yk' },
  { name: 'guu cursor', text: '  indented\nnormal', cursor: [1, 9], keys: 'guu' },
  { name: '2guu cursor', text: '  indented\nnormal', cursor: [1, 9], keys: '2guu' },
  { name: 'gUgg cursor', text: '  indented\nnormal', cursor: [1, 3], keys: 'gUgg' },
  { name: 'VU cursor', text: '  a', cursor: [1, 2], keys: 'VU' },
  { name: 'VjU cursor', text: '  a\n  b', cursor: [1, 2], keys: 'VjU' },
  { name: 'Vjy cursor', text: '  a\n  b', cursor: [1, 2], keys: 'Vjy' },
  { name: '3J last line', text: 'a\nbb', cursor: [2, 1], keys: '3J' },
  { name: '3J single line', text: 'a b c', cursor: [1, 3], keys: '3J' },
  { name: '3gJ joins', text: 'one two\nthree four', cursor: [1, 4], keys: '3gJ' },
  { name: 'd} at last char', text: 'foo bar', cursor: [1, 6], keys: 'd}' },
  { name: '<} at last char', text: 'foo bar', cursor: [1, 6], keys: '<}' },

  // --- fuzz-discovered: backward ranges / zero ranges / text objects --------
  { name: 'd( from column 0', text: 'a\nb', cursor: [2, 0], keys: 'd(' },
  { name: 'd( from col0 mid buffer', text: 'function f() {\n  return 1;\n}', cursor: [3, 0], keys: 'd(' },
  { name: 'db from column 0', text: 'a\n\nb\n\nc', cursor: [4, 0], keys: 'db' },
  { name: 'gu0 zero range', text: 'AB', cursor: [1, 0], keys: 'gu0' },
  { name: 'g~0 zero range', text: 'ab', cursor: [1, 0], keys: 'g~0' },
  { name: 'gJ keeps indent', text: 'function f() {\n  return 1;\n}', cursor: [1, 11], keys: '3gJ' },
  { name: 'J strips indent', text: 'function f() {\n  return 1;\n}', cursor: [1, 11], keys: '3J' },
  { name: 'block < mid-line spaces', text: 'x = "a"; y = "b";', cursor: [1, 8], keys: '<C-v>E<' },
  { name: 'i( ahead fallback', text: 'const x = (a + b);', cursor: [1, 0], keys: 'di(' },
  { name: 'i( ahead cursor', text: 'const x = (a + b);', cursor: [1, 0], keys: 'yi(' },
  { name: '2di( fallback no-op', text: 'const x = (a + b);', cursor: [1, 0], keys: '2di(' },

  { name: 'yG single line cursor', text: 'ab', cursor: [1, 1], keys: 'yG' },
  { name: 'yG last line cursor', text: 'ab\ncd', cursor: [2, 1], keys: 'yG' },
  { name: 'guk cursor', text: '  indented\nnormal', cursor: [2, 2], keys: 'guk' },
  { name: ') over blank line', text: 'a\n\nb\n\nc', cursor: [3, 0], keys: ')' },
  { name: '2) over blank line', text: 'a\n\nb\n\nc', cursor: [3, 0], keys: '2)' },

  // --- g*/g# (search the word without word boundaries) ----------------------
  { name: 'g* finds inside words', text: 'foo foobar foo', cursor: [1, 0], keys: 'g*' },
  { name: 'g# finds back inside words', text: 'foo foobar foo', cursor: [1, 12], keys: 'g#' },
  { name: '2g* second match', text: 'foo foo bar foo', cursor: [1, 0], keys: '2g*' },
  { name: '2* second occurrence', text: 'foo foo bar foo', cursor: [1, 0], keys: '2*' },

  // --- gn: next search match as a motion/selection --------------------------
  { name: 'gn selects next match', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>gggn' },
  { name: '2gn selects second match', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>gg2gn' },
  { name: 'dgn deletes next match', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>dgn' },
  { name: 'cgn changes next match', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>cgnX<Esc>' },
  { name: 'dgn dot repeats', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>dgn.' },
  { name: 'cgn dot changes next match', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>cgnX<Esc>.' },
  { name: 'visual gn extends', text: 'foo bar foo baz', cursor: [1, 0], keys: '/foo<CR>ggvgn' },

  // --- fuzz seed 11/23 leftovers (triage) -----------------------------------
  { name: 'dt( bracket', text: '(a (b) c)', cursor: [1, 2], keys: 'dt(' },
  { name: '2cw inside word', text: 'the end is nigh', cursor: [1, 2], keys: '2cwxy<Esc>' },
  { name: 'cw on comma', text: 'a,b,c,d', cursor: [1, 3], keys: 'cwxy<Esc>' },
  { name: 'vk$d', text: 'a\nb\nc\nd', cursor: [2, 0], keys: 'vk$d' },
  { name: '3cW', text: 'x = "a"; y = "b";', cursor: [1, 0], keys: '3cWxy<Esc>' },
  { name: '3gUgg cursor', text: 'function f() {\n  return 1;\n}', cursor: [1, 6], keys: '3gUgg' },
  { name: 'g~j cursor', text: 'one\ntwo\nthree\nfour\nfive', cursor: [4, 2], keys: 'g~j' },

  { name: '2daW', text: 'one two\nthree four', cursor: [1, 5], keys: '2daW' },
  { name: '2daw', text: 'one two\nthree four', cursor: [1, 5], keys: '2daw' },
  { name: 'v-block )kU', text: '  indented\nnormal', cursor: [2, 0], keys: '<C-v>)kU' },

  { name: 'gI insert at column 0', text: '  abc', cursor: [1, 4], keys: 'gIX<Esc>' },
  { name: 'gi last insert position', text: 'abc\ndef', cursor: [1, 1], keys: 'iX<Esc>jgiY<Esc>' },

  // --- \zs / \ze match endpoints ------------------------------------------
  { name: 'search \zs start', text: 'foo bar baz', cursor: [1, 0], keys: '/foo \zsbar<CR>' },
  { name: 'search \ze end', text: 'foo bar baz', cursor: [1, 0], keys: '/foo\ze bar<CR>' },
  { name: ':s with \zs', text: 'foo bar\nfoo baz', cursor: [1, 0], keys: ':%s/foo \zsbar/X/<CR>' },
  { name: ':s with \ze', text: 'foo bar\nfoo baz', cursor: [1, 0], keys: ':%s/foo\ze bar/X/<CR>' },

  { name: 'vlB< visual EOL', text: 'function f() {\n  return 1;\n}', cursor: [3, 0], keys: 'vlB<' },


  { name: 'Vku cursor', text: 'one two\nthree four', cursor: [2, 9], keys: 'Vku' },

  { name: 'gUap cursor', text: 'one two\nthree four', cursor: [1, 5], keys: 'gUap' },

  { name: '2yaW cursor', text: 'a b c', cursor: [1, 2], keys: '2yaW' },

  { name: '<i( empty pair cursor', text: 'function f() {\n  return 1;\n}', cursor: [1, 8], keys: '<i(' },

  { name: 'V(y blank-line sentence', text: 'a\n\nb\n\nc', cursor: [5, 0], keys: 'V(y' },

  { name: 'd$ on empty line', text: 'a\n\nb', cursor: [2, 0], keys: 'd$' },

  { name: 'gU{ at BOF', text: 'a\nb\nc', cursor: [1, 0], keys: 'gU{' },

  { name: 'gUaW on blank line', text: 'a\n\nb\n\nc', cursor: [2, 0], keys: 'gUaW' },

  { name: 'dFa backward find', text: '(a (b) c)', cursor: [1, 3], keys: 'dFa' },
  { name: 'gUF space backward', text: '  indented', cursor: [1, 3], keys: 'gUF ' },

  { name: '3ciW across lines', text: 'a\nb\nc\nd', cursor: [1, 0], keys: '3ciWxy<Esc>' },
  { name: '3gUiW across lines', text: 'a\nb\nc\nd', cursor: [2, 0], keys: '3gUiW' },

  { name: '2daw on whitespace', text: 'x = "a"; y = "b";', cursor: [1, 1], keys: '2daw' },
  { name: '3gUaw on whitespace', text: 'x = "a"; y = "b";', cursor: [1, 3], keys: '3gUaw' },

  { name: '2ciw same line', text: 'foo bar baz', cursor: [1, 1], keys: '2ciwxy<Esc>' },

  { name: 'gg=G simple braces', text: 'if (x) {\ny;\n}', cursor: [1, 0], keys: 'gg=G' },
  { name: 'j== simple braces', text: 'if (x) {\ny;\n}', cursor: [2, 0], keys: 'j==' },
  { name: '=G simple braces', text: 'if (x) {\ny;\n}', cursor: [1, 0], keys: '=G' },
  { name: 'Vj= simple braces', text: 'if (x) {\ny;\n}', cursor: [1, 0], keys: 'Vj=' },

  { name: 'gg=G nested braces', text: 'if (x) {\nif (y) {\nz;\n}\n}', cursor: [1, 0], keys: 'gg=G' },

  // (ex commands are covered by tests/vim.test.ts; they cannot run through :normal in -es)
];
