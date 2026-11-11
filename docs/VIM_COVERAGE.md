# VIM COVERAGE — what this engine actually implements

VIMLORE is being built as **the most comprehensive Vim training terminal ever
attempted** — no artificial cap on commands, tips, or advanced features. That is
a destination, not a current-completeness claim. The engine is a **subset chosen
for this slice**, kept honest by a differential oracle:
`tools/oracle-diff.ts` replays **373 keystroke cases** through a real
`vim -u NONE` and through the engine, and requires identical buffers and
cursors. If you implement something new, add a case there first.

The **surface audit** (`npm run surface -- --strict`, CI gate) proves the other
direction: every Grimoire command has oracle or unit evidence, every oracle case
maps to a command or an explicit engine-only feature, and there are no orphan
cases. The generated map is [`ENGINE_SURFACE.md`](ENGINE_SURFACE.md).

This page is the answer to "does it support everything Vim does?" — **not yet.**
Below is the exact boundary, so nobody has to guess. Deferred domains (buffers,
files, splits, tabs, folds) are listed with the reason and, where designed, the
roadmap in [`FUTURE_EDITOR.md`](FUTURE_EDITOR.md).

## Implemented

**Modes** normal · insert · replace · visual · visual-line · visual-block ·
command-line · search · operator-pending.

**Insert mode** printable text (including the space bar), `<CR>`, `<BS>`,
`<Del>`, `<Tab>`, `<C-w>`, `<C-u>`, `<C-r>{register}`, `<C-o>{one normal
command}`, `<Esc>`. Counts before `i a I A` repeat the typed text; counts
before `o O` open that many lines with the typed text.

**Motions** `h j k l 0 ^ $ |` · `w W b B e E ge gE` · `f F t T ; ,` · `gg G` ·
`{ } ( )` · `%` · `/ ? n N * # g* g#` · `'` and `` ` `` marks · `<C-d> <C-u> <C-f>
<C-b> <C-e> <C-y>` · `<C-o> <C-i>` jumplist · `+ - _ <CR> <Space> <BS>` ·
backward `(` built from real sentence starts (BOF, blank-run last line,
paragraph starts, `[.!?]` + whitespace) ·
`H M L` (approximated as top/middle/bottom of the buffer).

**Operators** `d c y > <` · `g~ gu gU gq gw` · doubled forms `dd cc yy >> <<` ·
`x X s S D C Y` · `r` · `~` · `J gJ` · `p P` · `u <C-r>` · `.` with counts
(`s S Y u <C-r> i a I A o O` now honor them; `C D` ignore them as Vim does).

**Text objects** `iw aw iW aW` · `i" a" i' a' i\`` a\`` · `i( a( ib` ·
`i[ a[` · `i{ a{ iB aB` · `i< a<` · `it at` · `ip ap` · `is as`.

Multi-line bracket blocks whose brackets own their lines are **linewise**
(`di{` removes whole inner lines and keeps the braces on separate lines;
`ci{` opens an empty line); an empty pair (`f()`, `""`) is a no-op that
parks the cursor on the closing delimiter, and `ci(`/`ci"` insert before it.
Counted `iw` counts a run of spaces as one unit, skips line breaks, and keeps
an adjacent punctuation token in range; `iW` across lines is linewise.

**Visual** `v V <C-v>` · `o` · operators · block `I`/`A` · `gv`.

**Search** magic, `\v`, `\V`, `\c`, `\C`, smartcase, highlight · `gn`
(selects/operates the next match; counts, operator-pending `dgn`/`cgn`, visual
extension, dot repeat) · `g*` / `g#` (word under cursor without `\<...\>`
boundaries) · `\zs` / `\ze` match start/end offsets (also inside `:s`).

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

**Undo** linear undo/redo (`u`, `<C-r>`) plus numeric `:earlier N` / `:later N`.

**Indentation** `>`/`<` shift by `shiftwidth`; `=` / `gg=G` / visual `=` do a
simple brace-depth C indent in spaces. No filetype `indentexpr`, and braces
inside strings/comments are not parsed.

## Not implemented yet (deferred)

Everything below is backlog/deferred, not a product rejection, unless the
`why` column names a product boundary. Deferred features are not in today's
taught surface; they enter it only with oracle proof.

| area | missing | why |
|---|---|---|
| windows | splits, tabs, buffers, `:vsp`, `<C-w>` | deferred editor program, design in `FUTURE_EDITOR.md`; every level is one buffer |
| folds | `zf zo zc za zR` | deferred with the viewport/editor phases |
| completion | `<C-n> <C-p> <C-x>`, digraphs, abbreviations | deferred; needs a file corpus and an editor phase |
| indentation | filetype-aware `=`/`indentexpr`, tab/expandtab policy | simple brace-depth `=` exists; no filetype rules |
| files | `:e :r :w file`, `:!cmd`, terminal, `:bd` | deferred editor program; the browser has no filesystem today |
| options | `:set` | `textwidth`/`shiftwidth` come from the level |
| undo tree | `g-`, `g+`, time units for `:earlier/:later`, persistent undo | linear undo + numeric `:earlier/:later` only |
| change list | `g;` `g,` | rare in teaching material |
| filters | `!{motion}`, `:!` | no shell |
| tooling | quickfix, `:vimgrep`, ctags, LSP, treesitter | outside the current surface; deferred until a tooling phase (not designed yet) |
| scripting | Vimscript/Lua, `:map`, autocmds, plugins | the game *is* the plugin |
| interactive substitute | `:s///c` with y/n/a/q/l, `g`+`c`, Esc abort | prompt/status integrated; oracle cannot automate the confirmation keys |
| misc | `zz/zt/zb`, `H/M/L` exact semantics, `ZZ/ZQ`, mouse | deferred viewport/mouse phase; the canvas is one window today |

## If you need a missing feature

1. Add one or more cases to `tools/cases.ts` describing the keystrokes.
2. Run `node --experimental-strip-types tools/oracle-diff.ts` — it prints the
   exact divergence against real Vim.
3. Implement it in `src/core/vim/`, then `--emit` a new snapshot.
4. `npm test` and `npm run lint:levels` must stay green.
5. Update this table. Adding a row here is cheaper than a bug report later.
