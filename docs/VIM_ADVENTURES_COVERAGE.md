# Vim Adventures command coverage

Audit of the command list a player meets in *Vim Adventures*, against this
engine. Status means **observable buffer/cursor behaviour on the current
tested surface**, not "a key exists".

- `exact` — implemented and covered by oracle/matrix/unit cases.
- `approx` — implemented with a documented simplification.
- `missing` — no implementation (or an explicit no-op message).
- `deferred` — intentionally outside the single-buffer slice; not rejected.

## Motions

| Command | Status | Notes |
|---|---|---|
| `h j k l` | exact | |
| `w W e E b B` | exact | |
| `0 ^ $` | exact | |
| `f F t T ; ,` | exact | |
| `%` | exact | bracket matching; `[count]%` percentage |
| `g`, `gg`, `G` | exact | `gg`/`G` plus the implemented `g` menu |
| `{ } ( )` | exact | paragraph/sentence motions |
| `[ {`, `] }`, `[ (`, `] )` | missing | bracket-block motions; bracket text objects work |
| `H M L` | approx | top/middle/bottom of the **buffer**, not the viewport |
| `z zt zz zb` | missing | explicit "viewport is the whole scroll" no-op |
| `+ -` | exact | |
| `n N` | exact | search repeat |
| `* #` | exact | word search |
| `|` | exact | column motion |

## Counts

Digits `1-9` are parsed globally. Counts before motions and operators are
covered by the matrix. Counts before simple commands were **not systematically
covered**; the following now have explicit cases: `i a I A o O`, `s S`, `Y`,
`u <C-r>`, `.`, `x X r ~ J gJ p P`. `C` and `D` deliberately ignore the count,
as Vim does. A count matrix over every normal command is still future work.

## Operators and edits

| Command | Status | Notes |
|---|---|---|
| `d dd D x X` | exact | |
| `r` | exact | count replaces N chars |
| `~` | exact | count toggles N chars |
| `c cc C s S` | exact | counts honoured for `s S`; `C` ignores count like Vim |
| `y yy Y` | exact | `Y` honours count |
| `p P` | exact | count-aware |
| `.` | exact | count repeats the change |
| `u`, `CTRL-R` | exact | count loops implemented |
| `g~ gu gU gq gw` | exact | |

## Insert

`i I a A o O` exact, including counts (`3i0` -> `000abc`, `3o0` -> three
lines). Insert-mode keys: text, space, `<CR>`, `<BS>`, `<Del>`, `<Tab>`,
`<C-w>`, `<C-u>`, `<C-r>{register}`, `<C-o>{one normal command}`, `<Esc>`.

## Registers, marks, macros

| Item | Status | Notes |
|---|---|---|
| `"` register prefix | exact | |
| `"" "- "_` | exact | unnamed, small-delete, black-hole |
| numbered `0-9` | exact | yank/delete history, shifts on delete |
| letter `a-z`, append `A-Z` | exact | |
| `:reg` | missing | registers work but there is no listing command |
| `m`, `'`, `` ` `` | exact | set/jump marks |
| `:marks`, `:delmarks` | missing | |
| `q @` macros | exact | record/run, counts |
| `+ -` (in challenge list) | exact | motions |

## Search, ex, files

| Item | Status | Notes |
|---|---|---|
| `/ ?` | exact | |
| `:s`, ranges, `g/`, `v/` | exact | |
| `:set nu/rnu` | exact | |
| `:rnu` as a command | missing | use `:set rnu`; direct `:rnu` is not wired |
| `:w`, `:q` | fake | echoes success; no file/exit |
| `:e` | missing | |
| `:b`, `:ls` | deferred | buffers intentionally outside the current slice |
| files (`:w/:e`) | deferred | same |
| buffers/splits/tabs | deferred | see `FUTURE_EDITOR.md` |
| folds, completion, `:!`, quickfix/LSP, Vimscript/Lua | deferred | explicit refused surface |

## Current evidence

See [`STATUS.md`](STATUS.md) for generated oracle/matrix/count/state/build
numbers. The status table is not copied here on purpose; this file owns the
feature-by-feature verdicts, STATUS owns the measurements.
