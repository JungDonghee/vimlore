# CURRICULUM — the ten floors

The tower teaches Vim as a **language**: operators are verbs, motions and text
objects are nouns, counts are numbers, registers are containers. Each chapter
adds grammar, then immediately makes the player *speak*.

**Source material (all ten books are in `books-text/`, gitignored):**
Learning the vi and Vim Editors · Practical Vim · Pro Vim · Modern Vim ·
Vim 101 Hacks · Gourmet Vim · Vim Reference Guide · Use Vim Like A Pro ·
5 Years of Vim · Neovim for Beginners.

> **Provenance rule — read [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md)
> before changing any level.** The ten books are the syllabus authority; the
> order must be gradual, prerequisite-correct and nearly painless. The current
> chapters are theme-aligned, but **section-level book citations and a pacing
> audit are not complete yet**. Do not invent a plausible stage and call it
> book-derived. Engine support and curriculum coverage are separate: a command
> can be oracle-tested before it is taught.

---

## 1. Awakening — movement, insertion, undo
`h j k l 0 $ x i a A o O u Esc`

| # | stage | insight |
|---|-------|---------|
| 1 | First Light | h j k l are directions, not letters |
| 2 | The Long Corridor | a count before a motion repeats it (`13l`) |
| 3 | Static | `x` cuts what is under you; `$` is the far wall |
| 4 | The Missing Letters | `i` before / `a` after; `Esc` is how you leave |
| 5 | The Nameplate | combine count + delete + insert + jump |

## 2. Words — word motion and single-char surgery
`w b e W B E r ~ f F t T ; ,`

| # | stage | insight |
|---|-------|---------|
| 1 | The Coin Field | `w` lands on word starts; `f$` + `;` is a laser |
| 2 | Backwards Through | `b`/`B` walk back; coins behind you |
| 3 | The Typo | `r` replaces without leaving normal mode |
| 4 | The Shouting King | count + `~` flips a whole line |
| 5 | CONFIG | hazards punish the wrong landing; `f`/`;` is precise (the `t` lesson is queued) |

## 3. Operators — the grammar of verbs
`d c y p P . dd yy cc D C`

| # | stage | insight |
|---|-------|---------|
| 1 | Pruning | `dw` = delete + motion; the operator waits for a noun |
| 2 | The Rot | `dd` removes whole lines; `3dd` removes three |
| 3 | Rename | `cw` changes a word and drops you into insert |
| 4 | The Copyist | `yy` + `p` duplicates; `P` puts above |
| 5 | The Repeat | `dw` then `.` fixes the same rot everywhere |

## 4. Text Objects — nouns with shapes
`iw aw i" a" i( a( it ip`

| # | stage | insight |
|---|-------|---------|
| 1 | Inside the Word | `ciw` ignores where in the word you stand |
| 2 | The Quarantine | `ci"` edits a string without touching its quotes |
| 3 | Arguments | `di(` clears a call's inside, brackets stay |
| 4 | Paragraphs | `dap` deletes a paragraph and its air |
| 5 | The Nest | `ci{` inside `ci"`, and `it` for tags |

## 5. Visual Mode — pointing at many things
`v V <C-v> o > < J gv`

| # | stage | insight |
|---|-------|---------|
| 1 | The Sweep | select first, operate second |
| 2 | The Block | `V` + `>` indents a wall of lines |
| 3 | Columns | `<C-v>` + `I` writes on many lines at once |
| 4 | Seams | `J` joins, `gJ` joins without a space |
| 5 | The Ledger | block edit + `~` + `>` on a table |

## 6. Search — the page as a map
`/ ? n N * # :s :%s`

| # | stage | insight |
|---|-------|---------|
| 1 | The Odd Word | `/` then `n` — stop reading, start landing |
| 2 | Under the Cursor | `*` searches the word you are standing on |
| 3 | One Line | `:s/old/new/` is a scalpel |
| 4 | Everywhere | `:%s/old/new/g` is a flood |
| 5 | The Chameleon | `:%s` + `n` + `*` to hunt a shapeshifter |

## 7. Registers & Macros — memory and automation
`"a q @ @@ :g :v`

| # | stage | insight |
|---|-------|---------|
| 1 | Drawers | `"ayy` stashes a line, `"ap` brings it back |
| 2 | The Automaton | `qa…q` records, `@a` replays |
| 3 | Chorus | `3@a` runs the ritual three times |
| 4 | Sieve | `:g/pattern/d` deletes by rule, not by hand |
| 5 | The Factory | record a fix, apply it to every marked line |

## 8. Marks & Jumps — the map in your head
`m ` ' % { } ( ) <C-o> <C-i>`

| # | stage | insight |
|---|-------|---------|
| 1 | Pins | `ma` … `'a` teleports |
| 2 | Brackets | `%` crosses a structure in one keystroke |
| 3 | Paragraphs | `{` `}` move by thought, not by line |
| 4 | The Trail | `<C-o>` walks back through your jumps |
| 5 | The Labyrinth | marks + `%` + `{` in one route |

## 9. Command Line — the operating table
`:1,3d :m :t :sort :normal`

| # | stage | insight |
|---|-------|---------|
| 1 | Ranges | line ranges are addresses |
| 2 | Reorder | `:m` and `:t` move/copy blocks |
| 3 | Order | `:sort` fixes a shuffled ledger |
| 4 | Batch | `:normal` applies keys to many lines |
| 5 | Surgery | ranges + `:normal` + `:s` on one document |

## 10. The Weave — formatting and mastery
`gq gJ gu gU` + everything

| # | stage | insight |
|---|-------|---------|
| 1 | Reflow | `gq` re-wraps prose to the width |
| 2 | Voice | `gU`/`gu` change case by range |
| 3 | Seams II | `gJ` vs `J` |
| 4 | The Chorus | macro + text object + dot in one breath |
| 5 | The Last Page | restore a whole corrupted document |

---

## After the tower

`Endless` mode generates drills from the same skill pool (see
`src/core/game/trials.ts`). Any new chapter automatically feeds it.
