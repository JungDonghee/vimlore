# KIRITSU autonomous automation log — 2026-11-13

Window: **until 23:58 KST**. Story/LIVE/puzzle work is explicitly deferred until
the user returns. Campaign first-clear determinism, par, gates, solutions and
story canon must not change.

## Active automations

- Goal `goal-45d65ecd-1f21-4649-988f-1c653abee9f2` — max 12 rounds.
- `schedule-1b6a9f80-619a-4708-bbc3-840687efe27d` — every 30 min from 21:00
  until 23:55 KST, this session.
- `schedule-8ed2dbf2-fc91-4465-b7de-8a49d3f831df` — final checkpoint 23:45 KST.

## Baseline at 20:46 KST

- HEAD `f6d508b` (before this log); live Pages green.
- Tests 39 of 39; real-Vim oracle 373 of 373; level-oracle 51 of 51.
- State matrix has known undo-cursor divergences. An attempted blanket linewise
  undo-column fix broke `2cj` (`undo` column 2) and was reverted. No engine
  change is committed in this window yet.
- Single-file title inlines the Ouyang SVG; gate 420,000 raw / 140,000 gzip.
- CI and Pages green for `f6d508b`.

## Rules for every round

1. One isolated change; measure before/after state-matrix.
2. Revert immediately on any oracle/level/test/state regression.
3. Run tests, oracle, state-matrix, level-oracle, tsc, build, budget, PWA QA,
   Korean/doc/status gates.
4. Commit/push only green. Never touch campaign first-clear data or story canon.
5. Stop at 23:58 KST. Leave this log current.

## Round 1 — 20:46–21:00 KST

- Re-read the goal, workspace, and baseline.
- Confirmed `HEAD` was `dc1e218`; engine baseline was clean.
- State-matrix baseline: **21,593 / 21,712 matched, 119 divergences**
  (undo 110, reg 10, regtype 8). Real-Vim oracle 373 of 373, level-oracle 51 of 51.
- Attempt 1: overwrite visual shift undo with the anchor column. Regressed
  many `v0>`/`vG>` cases (field count rose sharply); reverted.
- Attempt 2: make all empty linewise deletes undo at column 0. Fixed some
  `dgg` cases but broke `2dj`/`2dd` (Vim keeps the command column); reverted.
- Attempt 3: derive a broad "range start vs command column" rule for linewise
  delete/change and charwise shift. It fixed some examples but raised
  divergences to 603; reverted.
- No engine change is committed. The goal remains active; next round will
  isolate one motion family and add a focused differential fixture instead of
  changing the shared undo path globally.
- Public/release work already green before this round: self-contained
  `dist/vimlore.html`, measured 420k/140k gate, final hero/social/OG, GitHub
  About/topics, CI and Pages.

## Round 2 — 21:00–21:15 KST

- Read Vim's `undo.c` restore path. The real rule is: save the pre-change
  cursor, restore its column only if the post-change cursor stayed on the same
  line, otherwise `beginline(BL_SOL | BL_FIX)`; special-case a one-line offset.
- Applied that model to linewise deletes only. It matched 81 of the 118 undo
  failures in a dry prediction, but the real engine run rose to **256**
  divergences because the engine's post-command cursor differs on empty-buffer
  and counted-range cases. Reverted.
- Tried isolated `dd`/`2dd` column and visual-line-column overrides; each broke
  more already-correct cases than it fixed. All reverted.
- **No engine change committed.** Game-used undo remains exact:
  `level-oracle -- --undo` = **51 of 51**.
- Full matrix remains 21,593/21,712 (119 open: undo 110, reg 10, regtype 8).
- Next round: add a tiny fixture around one command (`dd`, `dgg`, or `Vj>`),
  probe Vim's exact pre/post cursor, and fix only that command. Do not change
  the shared undo path again.

## Round 3 — browser audit

- Found a real non-engine regression: portrait `390x844` and `320x568` title
  had off-viewport bootlog/petal elements behind the rotate gate.
- Added a portrait-only rule that hides the metric rails and petals; the gate
  remains. `npm run browser:audit`: **50 screens/viewports, 0 overflow, 0 page
  errors**.
- Engine still at the 119-open baseline; no undo change committed. Game-used
  stages remain 51 of 51 solution+undo.

## Round 4 — dd fixture probe

- Probed real Vim for `dd`, `2dd`, `3dd` at columns 0/1/2. Confirmed:
  - `2dd`/`3dd` preserve the command column when the buffer remains nonempty;
  - single `dd` does not (except indented-line cases), and deleting the last
    line zeros the column.
- Applied only the counted-linewise case (`count > 1`, buffer nonempty).
  State matrix moved from 119 to **121** divergences; two previously matching
  cases regressed. Reverted immediately.
- No engine change committed. Baseline remains 119 (undo 110, reg 10,
  regtype 8); game-used solution+undo remains 51 of 51.
- Portrait overflow fix from the prior round stays green:
  `browser:audit` = 50 screens/viewports, 0 overflow, 0 page errors.
- Rebuilt and verified: tests 39 of 39, oracle 373 of 373, budget
  402,788 / 131,115, PWA QA and STATUS green.

## Round 5 — first real reduction

- Added a narrow engine rule: counted **doubled** linewise delete (`2dd`, `3dd`)
  restores the command column on undo when the buffer remains nonempty. This is
  the exact Vim behavior probed for `2dd`/`3dd`; it deliberately does not touch
  `2d%`, `dgg`, `2dj`, single `dd`, or visual ranges.
- State matrix: **119 → 118** divergences (matched 21,593 → 21,594; undo
  110 → 109). No new failures; `m-14904` fixed.
- Added a regression test to `tests/vim.test.ts`.
- Oracle 373 of 373, level-oracle 51 of 51 solution+undo, tests 39 of 39,
  build/budget/PWA/status green.

## Round 5b — single dd indentation

- Probed Vim: single `dd` keeps `min(command column, first non-blank)` when the
  deleted line is indented; plain lines land at 0. `2dd`/`3dd` keep the command
  column when the buffer remains.
- Fixed the effective count (`0` means count 1) and implemented the two narrow
  doubled cases. State matrix: **119 → 117** (matched 21,595; undo 108; reg 10;
  regtype 8). `m-8864` and `m-14904` fixed; no new failures.
- Added regression tests for both. Oracle 373 of 373, level-oracle 51 of 51
  solution+undo, tests green, build/budget/PWA green.

## Round 6 — linewise motion deletes

- Probed Vim's linewise delete undo for `dgg`, `dG`, `dB`, `2dgg`, `dk`:
  - a multi-line motion delete lands on the range's first line;
  - if the range starts on the command line, keep the command column;
  - if it crossed from another line, use that line's first non-blank;
  - `dk` is the exception: non-empty undo is column 0, an emptied buffer keeps
    the command column.
- Implemented only for non-doubled multi-line motion deletes; text objects,
  single-line deletes, visual ranges, and `dd` keep their existing probed rules.
- State matrix: **117 → 108** (matched 21,604; undo 99; reg 10; regtype 8).
  No new failures; 11 old failures removed.
- Added `dgg`/`2dgg`/`dk` regression tests. Oracle 373 of 373, level-oracle
  51 of 51 solution+undo, build/budget/PWA green.

## Round 7 — change/shift probes

- Tried extending the linewise start-column model to multi-line linewise
  **change** (`cgg`, `2c%`). It raised divergences from 108 to 126 by breaking
  `cj`, `cG`, `cc`, and visual cases; reverted.
- Tried a visual-line delete anchor override: no net change; reverted rather
  than keeping an unproven rule.
- Tried a charwise `w`/`W` shift special case: no net reduction; reverted.
- No engine change committed this round. Stable baseline is **108** from
  `3fc33ba` (undo 99, reg 10, regtype 8); game-used solution+undo 51 of 51.
- Browser audit remains 50 screens/viewports, 0 overflow, 0 page errors.
