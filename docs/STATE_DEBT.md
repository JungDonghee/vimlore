# Engine state debt — honest ledger

> Game-used correctness is not the same as full-editor perfection. Keep both
> numbers visible; never call the engine perfect while this file is non-zero.

## Current

- Differential fuzz debt: **3 visual edge cases** in [`FUZZ_DEBT.md`](FUZZ_DEBT.md).
- Full observable-state matrix: **21,604 / 21,712 matched, 108 open**
  (`undo 99`, `reg 10`, `regtype 8`). Local-only; report regenerated with
  `npm run state-matrix -- --write`.
- Shipped stage solutions: **51 / 51** match real Vim (`npm run level-oracle`).
- Game-used solution + undo: **51 / 51** (`npm run level-oracle -- --undo`).
  c10s5 was fixed by reordering the level's own commands (not an engine hack);
  the last change is now the case operation, and its undo cursor is Vim-exact.
- All 51 stages have evidence-checked book citations; the citations are a
  build-time overlay and do not affect bundle/state.

## What the 108 mean

Most are **undo cursor** after edge-motion operators (counted/backward
linewise ops, visual ranges, `2>B`, `dgg`, etc.) and a few register/regtype
cases for count+text-object yanks. `dd`/`2dd`/`3dd` and multi-line motion deletes now follow probed Vim
start-column rules (`dgg`, `dG`, `dB`, `2dgg`, `dk` exception); 99 undo cases
remain. They are real Vim differences, not test noise and
are not silently waived.

## Priorities

1. Keep the **game-used** surface at zero: solutions and undo are 51/51
   (`GAME_USED_STATE.md`). A filtered command matrix can still be added if it
   remains exact.
2. Shrink full-matrix **undo** cases with a Vim-faithful cursor model, not
   stage-specific hacks. Do not touch a level to hide an engine difference.
3. Then register/regtype edge cases.
4. Never trade a green stage/level oracle for a full-matrix number.

## Non-goals

- Claiming 144fps without a 144Hz/GPU measurement.
- Faking Modern Vim levels before the documented engine surface exists.
- Adding runtime book citations; use the overlay.
