# VIMLORE — sprint final report

**Date:** 2026-11-12 (Asia/Seoul)
**Code freeze:** 21:20 KST (early; final verification still runs at 23:40)
**Status:** green candidate, not a claim of full-engine perfection.

## What was delivered

1. **A+B+C**
   - stage-level gating; level lint 51 of 51 under the real gate;
   - chapter/stage picker with cleared replay and sealed future stages;
   - browser-driven UX audit (1920/390/320, 38 screens) and responsive fixes.
2. **Books as the spine**
   - Practical Vim and Modern Vim indexed, evidence-audited, and prioritized;
   - **51 of 51 stages carry evidence-checked book citations**;
   - Practical Vim is the playable spine; Modern Vim is deferred where the
     single-buffer engine lacks the surface (no fake levels);
   - `GAPS.md` records 75 uncovered Practical tips as drill/deferred backlog.
3. **Correctness**
   - **level-oracle 51 of 51**: every shipped stage solution matches real Vim;
   - **game-used solution+undo 51 of 51**;
   - oracle 373 of 373, grammar matrix 21,712 of 21,712, count 162 of 162;
   - full state matrix is **21,593 of 21,712 (119 open)**, documented debt.
4. **Mastery / GOLF**
   - results screen reports GOLF par / over-par gap / best keys;
   - over-par clears make GOLF RETRY the primary action;
   - mastery loop and next drill/GOLF increments documented.
5. **UI**
   - static vector instrument frame + corner rules + low-opacity phosphor grid;
   - zero per-frame JS; desktop 57.6 FPS, mobile 60.5 FPS, audit clean;
   - full CRT vector HUD is future work, not claimed.
6. **Automation**
   - recurring 15-min continuation task, 23:40 freeze task, 23:58 report;
   - durable NORTH_STAR/SPRINT/HANDOFF/STATE_DEBT/FUZZ_DEBT/FINAL_CHECKPOINT.

## Exact metrics at checkpoint

- tests **39 of 39**
- stage lint **51 of 51**
- oracle **373 of 373**
- level-oracle solution **51 of 51**
- game-used solution+undo **51 of 51**
- grammar matrix **21,712 of 21,712**
- count matrix **162 of 162**
- full state **21,593 of 21,712**, 119 open (undo 110, reg 10, regtype 8)
- stage provenance **51 of 51** cited
- browser desktop **57.6 FPS**, mobile **60.5 FPS**
- browser audit **38 screens**, 0 overflow, 0 errors
- bundle **276,990 B raw / 86,091 B gzip** (gate 277,000/87,000)

## Honest remaining gaps

1. **Fuzz debt:** 3 visual edge cases from a 2,000-case fuzz
   (`FUZZ_DEBT.md`), not hidden or fixed by stage changes.
2. **Full state:** 119 edge cases outside the game-used surface
   (`STATE_DEBT.md`).
3. **Content breadth:** Practical Vim 48/123 tips are represented by a stage;
   75 are drills/deferred. Modern Vim needs engine work before playable levels.
4. **Performance:** 144fps is unverified; this environment is headless 60Hz /
   software rasterization. Desktop 57.6 FPS, mobile 60.5 FPS are the measured
   facts.
5. **UI:** vector frame/grid only; full HUD/gridlayers need bundle optimisation.

## Fuzz status

- CI smoke seed 7 / n=500: 339 matched, 161 skipped (vim error), **0 divergences**.
- Broader seed 42 / n=2,000: **3 visual edge cases**, recorded in
  `FUZZ_DEBT.md`; not claimed fixed.

## Live deployment

- `https://jungdonghee.github.io/vimlore/` — HTTP 200, title `VIMLORE`,
  0 console/page errors, live asset hashes match the frozen `dist/` build
  (verified 2026-11-12 21:22 KST).

## Reproduce

```bash
npm test
npm run lint:levels
npm run doc-check
npm run invariants
npm run surface -- --strict
node --experimental-strip-types tools/oracle-diff.ts
npm run level-oracle
npm run level-oracle -- --undo
npm run matrix
npm run count-matrix
npm run build
npm run budget
npm run status:check
npm run browser:qa
npm run browser:audit
```

Do not push a red state. Do not claim full-engine perfection while
`FUZZ_DEBT.md`/`STATE_DEBT.md` are non-empty.
