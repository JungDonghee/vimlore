# NEXT PROMPT — the literal kickoff for the next AI

> **Copy this entire file into the next session.** It is a task packet, a
> baseline, and a challenge — not a summary to skim.
>
> For a single copy-paste startup message, use [`ONE_MESSAGE.md`](ONE_MESSAGE.md)
> or run `npm run kickoff` (it fills the current HEAD).
>
> Baseline commit: **`20a1c3a`** (2026-11-11). If your checkout is at a different
> HEAD, **re-run the gates and update the baseline before trusting any number
> below**. Old prose is not evidence.
>
> Read order if you only read three files:
> [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md) → [`MASTER_PLAN.md`](MASTER_PLAN.md) →
> [`HANDOFF.md`](HANDOFF.md). Curriculum work additionally requires
> [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md),
> [`BOOKS_INDEX.md`](BOOKS_INDEX.md) and [`STAGE_PROVENANCE.md`](STAGE_PROVENANCE.md).

---

## 0. Role

You are the next orchestration AI for **VIMLORE**, a Vim-teaching terminal at
`/home/jung/ai_station/sandbox/vimlore` (GitHub `JungDonghee/vimlore`, live at
<https://jungdonghee.github.io/vimlore/>).

Your job is **not** to preserve this session. Your job is to **beat its
verified baseline** without breaking its invariants. The previous session is a
teacher; surpass it with better evidence, narrower changes, and a cleaner
handoff.

The human's standing directive, in priority order:

1. Fix engine bugs; real `vim -u NONE` is the only oracle.
2. Extend the engine toward advanced, transferable Vim — breadth is the
   product, with no artificial cap on commands/tips/features.
3. Keep desktop at 60 fps and a cheap phone smooth.
4. Make the play screen feel like a crafted Vim/Neovim window and state every
   stage's **LEARN / GOAL / CLEAR / PAR / WHY**.
5. **Do not add stages or chapters in this program.** The existing 51 stages
   are frozen content; the engine and curriculum truth are the product.
6. Leave the project greener: gates green, docs current, commit pushed, Pages
   deployed.
7. **Mastery is embodied.** Introduce → drill → transfer → spaced review.
   Repetition must be **varied** (text, cursor position, count, operator, nest,
   medium), never the same sentence repeated.
8. **The curriculum is book-derived, not AI-plausible.** The ten books in
   `books-text/` are the syllabus authority; every stage must trace to a section
   and fit a prerequisite graph.

## 1. Verified baseline — re-run, do not trust

| item | value at `20a1c3a` |
|---|---|
| oracle (strict) | **367/367** real-Vim cases |
| unit tests | **28/28** |
| level lint | **51/51** stages; every solution wins on its last key at `par` |
| tsc / doc-check | clean |
| invariants | **0 errors**, **15 coverage warnings** (not errors) |
| fuzz | all 9 seeds **buffer-content 0**; **14 cursor-only** |
| clean fuzz seeds | 7, 11, 23, 47, 131, 173 (0 total divergences) |
| build | **256,181 B** single · **81,640 B gzip (CLI)** |
| budget | **PASS** at 258,000 B raw / 82,000 B gzip; ~1.8 kB headroom |
| perf (headless) | desktop 1280×800 **52–57** fps x1, **51–53** x4 · phone 844×390 **59–60** x4, 57–60 x6 |
| CI / Pages | success / success at `20a1c3a` |
| live | `index-h-NBDcga.js` |
| tree | clean; all changes pushed |

**The gate wins over this table.** Run:

```bash
cd /home/jung/ai_station/sandbox/vimlore
git status && git log --oneline -5
npm run doctor
npm test
npm run lint:levels
npx tsc --noEmit
npm run doc-check
npm run invariants
npm run build
npm run budget
node --experimental-strip-types tools/oracle-diff.ts
```

Expected: 367/367, 28 pass, 51 valid, tsc 0, docs OK, 0 invariant errors,
build under budget. Then run the fuzz seeds you plan to touch; do not assume
they are still clean.

## 2. What is already done (do not redo)

- Engine: motions/operators/text objects, visual/block, registers/marks/macros,
  search + `\zs/\ze`, `gn/g*/g#`, `gI/gi`, jumps, `:s///c`, simple `=`/`gg=G`,
  numeric `:earlier/:later`, counted word objects, `d)`, `yk/yj`, `guu`, `2)`.
- UI: Vim window, horizontal/vertical viewport scrolling, cursor shapes,
  F1 primer, idle coach, in-game Settings modals (no browser dialogs),
  LEARN/GOAL/CLEAR/PAR/WHY, results **DRILL** cue.
- Verification: strict post-key invariants (`Vim({strict:true})`), seeded
  differential fuzz, 51-stage simulation, cross-layer `npm run invariants`,
  docs/build/CI, hard bundle budget, Playwright keyboard audit, perf harness.
- Handoff: `PROMPT_SYSTEM.md`, `MASTER_PLAN.md`, `HANDOFF.md`,
  `BOOKS_INDEX.md`, `STAGE_PROVENANCE.md` (5/51 cited, 46 unmapped).

## 3. Current debt — the baseline is honest, not complete

1. **Cursor-only fuzz, 14 edges** across seeds 31 (5), 101 (5), 211 (4).
   Known examples: `3g~gg`, `2gUG`, `gUgg`, `2gu(`, `yi(`, `di{`,
   `<C-v>b(`/`w>`, `2guiw`, `2gUaw`.
2. **Invariants coverage warnings, 15**: commands never declared by a stage and
   unlock keys without a Grimoire row. Decide metadata vs explicit allowlist;
   do not silently hide them.
3. **Curriculum provenance: 46/51 stages unmapped.** `BOOKS_INDEX.md` is a
   generated heading index; three books need a manual section scan. A row is
   `cited` only after reading the section and recording a prerequisite/varied
   drill plan.
4. **Desktop 60 fps is not verified.** Headless Chromium caps around 54–57 even
   with the canvas hidden/CRT off. A real GPU measurement is required before
   claiming 60.
5. **Bundle headroom ~1.8 kB raw.** A new feature will likely fail
   `npm run budget`; reduce first or raise the ceiling deliberately with a
   measured reason.
6. **Deferred editor program**: buffers/files/windows/tabs are not implemented;
   design only in `FUTURE_EDITOR.md`. Do not fake `:b`/`:sp` on `Vim.buf`.

## 4. How to surpass this baseline

Score yourself on these six axes; do not trade one for another silently.

| axis | baseline | surpass condition |
|---|---|---|
| Correctness | 266 oracle, 9 seeds content-clean, 14 cursor-only | **all nine seeds 0 total divergences**, strict oracle still green |
| Coverage honesty | 15 invariant warnings | 0 warnings, or an explicit allowlist with reasons and no hidden gaps |
| Curriculum truth | 5/51 cited | **51/51 cited** with prerequisite graph + varied-repetition plan (or a documented, source-backed exception) |
| Performance | headless 52–57 desktop / 60 phone | **60 fps on a real GPU** at x1 and x4, phone ≥59; screenshots + numbers |
| Craft | Vim window, drill cue | a measurable UI improvement verified keyboard-only + screenshot |
| Handoff | this file | next AI can resume in <30 min with the same gates and no rediscovery |

Suggested order (engine first, as the human directed):

1. **Cursor-only 14.** Reproduce each from its seed, add an oracle case, fix,
   emit, then all nine seeds. **Do not generalize a cursor rule across motions**
   (two attempts caused standard-seed regressions and were reverted); change one
   case at a time.
2. **Invariant warnings 15.** Inspect `npm run invariants`; either add real
   Grimoire metadata/teaches or create an explicit acknowledged-debt file.
   Acceptance: 0 errors and a defensible warning policy.
3. **Provenance 46 rows.** Use `BOOKS_INDEX.md`; add `Stage.sources` per row;
   regenerate `STAGE_PROVENANCE.md`; never invent a citation. Keep the 51
   stages frozen.
4. **Real-GPU 60 fps.** Use `pw/perf_local.mjs` and a GPU browser; record
   x1/x4, phone, method and limits. If the hardware is unavailable, write
   NOT VERIFIED rather than claiming it.
5. **Bundle.** Either cut below ~250 kB or raise the ceiling in a separate,
   explicit decision. Do not let a feature silently fail the gate.
6. **Only then** consider Tier 2 (`g;`/`g,`) and the deferred editor Phase A.

## 5. Working protocol (the part that prevents regressions)

- **Oracle case first.** A new engine behavior without a case is not done.
  After adding a case: `node --experimental-strip-types tools/oracle-diff.ts --emit`.
- **Strict invariants are on in oracle/fuzz.** Never suppress a violation.
- **Fuzz is a gate, not a demo.** Keep seeds 7/11/23/47/131/173 fully clean;
  reduce the remaining 14; never weaken the generator to hide a difference.
- **One workstream at a time.** No broad refactor while fixing an edge.
- **No red commits.** If a broad change breaks three unrelated oracle cases,
  revert and rethink; this session did that repeatedly.
- **Binary search the regression:** run the affected seed before/after.
- **Browser work:** keyboard-only; screenshot desktop 1280×800 and phone
  844×390; zero console/page errors; run `pw/audit.mjs`.
- **Budget:** `npm run verify` now builds and runs the budget gate.
- **Docs:** update counts and claims in the same commit; `doc-check` only
  checks some numbers.

## 6. Definition of done

```text
DONE:     task ids + one-line outcome
GATES:    oracle N/N · tests N · lint 51 · tsc · doc-check · invariants · build · budget
FUZZ:     seeds + divergences (content/cursor)
PERF:     hardware · x1/x4/phone · before/after
UI:       screenshots + audit result
CHANGED:  files with reasons
DECISIONS: rejected alternatives
OPEN:     exact repro + expected/actual
NOT VERIFIED: explicit list
HANDOFF:  HEAD, CI/Pages, live asset, next 3 tasks
```

Then:

```bash
git add -A && git commit -m "…"
TOKEN=$(cat /home/jung/ai_station/sandbox/.secrets/github_token)
git push "https://x-access-token:$TOKEN@github.com/JungDonghee/vimlore.git" main:main
git remote set-url origin https://github.com/JungDonghee/vimlore.git
```

Never print the token. Confirm CI + Pages and the live asset hash. Update this
file and `MASTER_PLAN.md`/`HANDOFF.md` in the same session.

## 7. Traps that already cost this session time

1. **Broad cursor rules regress standard seeds.** Case-level oracle cases only.
2. **`normal!` aborts on Vim errors.** The fuzzer's sentinel `<Esc>i!<Esc>` is
   intentional; keep it.
3. **Oracle state leaks** (search/jumps) — cases must be self-contained.
4. **Headless fps is not renderer fps.** Canvas hidden still caps ~54–57.
5. **`doc-check` is partial.** A green docs gate does not prove every claim.
6. **The bundle is nearly full.** Measure before writing a large feature.
7. **The PAT is outside the repo**; the remote must be scrubbed after pushes.
8. **`books-text/` is gitignored**; `BOOKS_INDEX.md` is derived, and three books
   have no chapter headings. Manual scan required.

## 8. If you only have one hour

1. Run the gates in §1 and record the real numbers.
2. Fix **one** cursor-only repro with an oracle case; run its seed.
3. Do not start a second workstream, do not add a stage, do not touch the
   deferred editor.
4. Update `HANDOFF.md` NOT VERIFIED and next steps; commit/push/Pages.

## 9. What to read, in order

1. This file.
2. [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md) — the reusable task/evidence protocol.
3. [`MASTER_PLAN.md`](MASTER_PLAN.md) — priorities, board, fuzz table.
4. [`AGENTS.md`](../AGENTS.md) — invariants and design laws.
5. [`HANDOFF.md`](HANDOFF.md) — current snapshot, gaps, traps.
6. [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md),
   [`BOOKS_INDEX.md`](BOOKS_INDEX.md),
   [`STAGE_PROVENANCE.md`](STAGE_PROVENANCE.md) — curriculum truth.
7. [`ARCHITECTURE.md`](ARCHITECTURE.md),
   [`VIM_COVERAGE.md`](VIM_COVERAGE.md) — layers and honest engine boundary.
8. [`FUTURE_EDITOR.md`](FUTURE_EDITOR.md) — deferred buffers/files/windows.

**One sentence:** keep the engine matching real Vim, keep the curriculum
book-derived and repetitive enough to embody, keep the build/page honest, and
leave a handoff so the next AI can do better than this one.
