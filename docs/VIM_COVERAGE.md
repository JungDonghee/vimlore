# VIM COVERAGE — what this engine actually implements

VIMLORE runs on its own Vim engine (`src/core/vim/`), not on Vim. It is a
**subset chosen for teaching**, kept honest by a differential oracle:
`tools/oracle-diff.ts` replays **223 keystroke cases** through a real
`vim -u NONE` and through the engine, and requires identical buffers and
cursors. If you implement something new, add a case there first.

This page is the answer to "does it support everything Vim does?" — **no.**
Below is the exact boundary, so nobody has to guess.

## Implemented

**Modes** normal · insert · replace · visual · visual-line · visual-block ·
command-line · search · operator-pending.

**Insert mode** printable text (including the space bar), `<CR>`, `<BS>`,
`<Del>`, `<Tab>`, `<C-w>`, `<C-u>`, `<C-r>{register}`, `<C-o>{one normal
command}`, `<Esc>`.

**Motions** `h j k l 0 ^ $ |` · `w W b B e E ge gE` · `f F t T ; ,` · `gg G` ·
`{ } ( )` · `%` · `/ ? n N * # g* g#` · `'` and `` ` `` marks · `<C-d> <C-u> <C-f>
<C-b> <C-e> <C-y>` · `<C-o> <C-i>` jumplist · `+ - _ <CR> <Space> <BS>` ·
`H M L` (approximated as top/middle/bottom of the buffer).

**Operators** `d c y > <` · `g~ gu gU gq gw` · doubled forms `dd cc yy >> <<` ·
`x X s S D C Y` · `r` · `~` · `J gJ` · `p P` · `u <C-r>` · `.` with counts.

**Text objects** `iw aw iW aW` · `i" a" i' a' i\`` a\`` · `i( a( ib` ·
`i[ a[` · `i{ a{ iB aB` · `i< a<` · `it at` · `ip ap` · `is as`.

**Visual** `v V <C-v>` · `o` · operators · block `I`/`A` · `gv`.

**Search** magic, `\v`, `\V`, `\c`, `\C`, smartcase, highlight · `gn`
(selects/operates the next match; counts, operator-pending `dgn`/`cgn`, visual
extension, dot repeat) · `g*` / `g#` (word under cursor without `\<...\>`
boundaries).

**Ex** `:s` (flags `g i &`), `:g`, `:v`, `:d`, `:m`, `:t`, `:sort` (`n u i !`),
`:normal`, `:set number/nonumber/relativenumber/nornu`, `:w :q :wq :x :noh`,
ranges `% . $ N 'a , ; + -`. Command-line editing has `<BS>`, `<C-w>`, `<C-u>`,
`<C-r>` and `↑`/`↓` history.


**Registers** unnamed, `0-9`, `a-z`, `A-Z` (append), `-`, `_`, `+`, `*`, `/`,
`:` — the last four are internal aliases, not the system clipboard.

**Marks** `a-z`, `<` `>`, `''`, and a real jump list with forward/back.

**Macros** `q{reg}`, `@{reg}`, `@@`, with counts.

**Numbers** `<C-a>` / `<C-x>` including Vim's default `nrformats=octal,hex`
(`007 + 1 → 010`, `0x1f + 1 → 0x20`).

**Undo** linear undo/redo (`u`, `<C-r>`).

## Not implemented (deliberate)

| area | missing | why |
|---|---|---|
| windows | splits, tabs, buffers, `:vsp`, `<C-w>` | every level is one buffer |
| folds | `zf zo zc za zR` | no viewport worth folding |
| completion | `<C-n> <C-p> <C-x>`, digraphs, abbreviations | no file corpus at runtime |
| indentation | `=`/`gg=G` with filetype rules | no `indentexpr`; `>` shifts by a fixed 2 |
| files | `:e :r :w file`, `:!cmd`, terminal, `:bd` | no filesystem in the browser |
| options | `:set` | `textwidth`/`shiftwidth` come from the level |
| undo tree | `g-`, `g+`, `:earlier/:later`, persistent undo | linear stack is enough |
| change list | `g;` `g,` | rare in teaching material |
| search extras | `\zs`, `\ze` | not needed by any level |
| filters | `!{motion}`, `:!` | no shell |
| tooling | quickfix, `:vimgrep`, ctags, LSP, treesitter | Neovim-only, out of scope |
| scripting | Vimscript/Lua, `:map`, autocmds, plugins | the game *is* the plugin |
| misc | `:s///c`, `zz/zt/zb`, `H/M/L` exact semantics, `ZZ/ZQ`, mouse | viewport/mouse do not exist |

## If you need a missing feature

1. Add one or more cases to `tools/cases.ts` describing the keystrokes.
2. Run `node --experimental-strip-types tools/oracle-diff.ts` — it prints the
   exact divergence against real Vim.
3. Implement it in `src/core/vim/`, then `--emit` a new snapshot.
4. `npm test` and `npm run lint:levels` must stay green.
5. Update this table. Adding a row here is cheaper than a bug report later.
