# NEXT STEPS — after the 2026-11-12 deadline

> The game-used surface is green. This file is the ordered backlog for the next
> AI, not a claim that the project is finished. Read NORTH_STAR first; do not
> lower gates or invent Vim behavior.

## 1. Engine: visual fuzz debt (highest)

`FUZZ_DEBT.md` has 3 exact repros from seed 42/n=2000:

1. `V)B><Esc>i!<Esc>` — linewise visual range after `)`/`B`.
2. `<C-v>)hy<Esc>i!<Esc>` — block yank final cursor.
3. `<C-v>)F"d<Esc>i!<Esc>` — block curswant/delete range.

Required:
- add each repro to `tools/cases.ts` / oracle, fix with a **curswant model**, not
  one-off stage changes;
- keep `level-oracle` 51 of 51 solution+undo and all stage lint green;
- run `npm run fuzz -- --n=2000 --seed=42` until 0 divergences, then raise the
  CI smoke count/seed.

## 2. Full state matrix 119 → 0

`STATE_DEBT.md` tracks 119 edge cases (undo 110, reg 10, regtype 8). The
game-used surface is already 51 of 51. Work from the report, add minimized oracle
cases per fix, and never change a level to hide an engine difference.

## 3. Curriculum breadth

Practical Vim has 123 tips; current stages represent 48. `GAPS.md` lists 75.
- classify each as supported / deferred surface / Modern Vim phase;
- add **verified drill/GOLF** challenges for supported gaps, with par/optimal
  keys proven by Session simulation and a book citation;
- Modern Vim stays deferred until the documented engine surface
  (buffers/windows/quickfix/terminal/plugins) exists.

## 4. Mastery / GOLF

Current: par/3-star, bestKeys, ghost, retry, DRILL cue, GOLF result/retry,
TRIALS weakness/daily. Next: a drill queue and a source-cited GOLF deck;
every generated challenge must be simulation-verified. See `MASTERY_VIM_GOLF.md`.

## 5. UI / optimisation

Shipped: static vector frame/corners/grid. Next: instrument HUD readouts,
stronger vector language, and only if bundle/FPS remain inside budget.
- mobile 390×844 ≥50 FPS, desktop headless ≥50;
- 144fps only with a 144Hz/GPU measurement, never a claim;
- zero runtime deps; bundle gate 278k/87k unless a measured raise is approved.

## Gates for every future change

```bash
npm test && npm run lint:levels && npm run doc-check && npm run invariants
npm run surface -- --strict
node --experimental-strip-types tools/oracle-diff.ts
npm run level-oracle && npm run level-oracle -- --undo
npm run matrix && npm run count-matrix
npm run build && npm run budget && npm run status:check
npm run browser:qa && npm run browser:audit
```

Do not push a red state. Update HANDOFF/STATUS/STATE_DEBT/FUZZ_DEBT when a
metric or debt changes.
