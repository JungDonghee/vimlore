# Engine state debt — honest ledger

> Game-used correctness is not the same as full-editor perfection. Keep both
> numbers visible; never call the engine perfect while this file is non-zero.

## Current

- Full observable-state matrix: **21,593 / 21,712 matched, 119 open**
  (`undo 110`, `reg 10`, `regtype 8`). Local-only; report regenerated with
  `npm run state-matrix -- --write`.
- Shipped stage solutions: **51 / 51** match real Vim (`npm run level-oracle`).
- Game-used solution + undo: **50 / 51** (`npm run level-oracle -- --undo`);
  c10s5 is a cursor-only diagnostic edge. Solution is 51/51.
- All 51 stages have evidence-checked book citations; the citations are a
  build-time overlay and do not affect bundle/state.

## What the 173 mean

Most are **undo cursor** after edge-motion operators (counted/backward
linewise ops, visual ranges, `2>B`, `dgg`, etc.) and a few register/regtype
cases for count+text-object yanks. They are real Vim differences, not test
noise. They are not silently waived.

## Priorities

1. Keep the **game-used** solution surface at zero (51/51). Undo is 50/51;
   close the c10s5 cursor edge without stage-specific hacks. A filtered command
   matrix can still be added if it remains exact.
2. Shrink full-matrix **undo** cases with a Vim-faithful cursor model, not
   stage-specific hacks. Do not touch a level to hide an engine difference.
3. Then register/regtype edge cases.
4. Never trade a green stage/level oracle for a full-matrix number.

## Non-goals

- Claiming 144fps without a 144Hz/GPU measurement.
- Faking Modern Vim levels before the documented engine surface exists.
- Adding runtime book citations; use the overlay.
