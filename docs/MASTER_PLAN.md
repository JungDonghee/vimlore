> **SUPERSEDED 2026-11-12.** This file is a historical planning snapshot. Its
> metrics and baseline commit are out of date. For the current green candidate,
> read [`FINAL_CHECKPOINT.md`](FINAL_CHECKPOINT.md), [`FINAL_REPORT.md`](FINAL_REPORT.md),
> [`STATE_DEBT.md`](STATE_DEBT.md), [`FUZZ_DEBT.md`](FUZZ_DEBT.md) and
> [`NEXT_STEPS.md`](NEXT_STEPS.md) before trusting any number below.

# MASTER PLAN — KIRITSU completion program (VIMLORE world)

> **Status: ACTIVE** · Orchestrator: the AI that wrote this file (2026-11-11)
> **Read order for the next AI:** [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md) → this file → [`AGENTS.md`](../AGENTS.md) →
> [`ARCHITECTURE.md`](ARCHITECTURE.md) → [`VIM_COVERAGE.md`](VIM_COVERAGE.md) →
> [`HANDOFF.md`](HANDOFF.md) → [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md) →
> [`EVALUATION.md`](EVALUATION.md).
> If any of those disagree with this file about **priority**, this file wins.
> If any of them disagree about **Vim semantics**, real `vim -u NONE` wins.

## 0. 한국어 요약 (사람이 읽는 용도)

- **북극성: 역사상 가장 방대한 Vim 훈련 터미널.** 커맨드·팁·고급 기능에 인위적 상한을 두지 않는다. 지금의 coverage는 현재 슬라이스일 뿐이며, 문서와 oracle이 정직하게 경계를 표시한다.
- **스테이지는 늘리지 않는다.** 지금은 엔진이 제품이다.
- **순서: 엔진 버그 → 고급 Vim 기능 확장 → 성능 최적화 → UI/목표 명시.**
- 플레이 화면은 **Vim/Neovim처럼** 보이고 동작해야 한다. 제목 화면의 CRT 감성은 유지.
- 각 스테이지는 시작 전에 **무엇을 배우는지(LEARN), 무엇을 하면 깨는지(GOAL), 3별 기준(PAR)** 을 명시한다.
- 이번 세션은 **5시간 슬라이스**만 한다(§5). 나머지는 태스크 보드에 남긴다.
- 다음 AI는 이 파일 → AGENTS → HANDOFF 순으로 읽고, 작업 전에 게이트 4개를 돌린다.

## 0.1 The human's directive (2026-11-11) — summarized, not paraphrased away

1. **Stage count is elastic. Do not add stages in this program.** Existing 51
   stages stay playable; content work is not the bottleneck.
2. **Fix engine bugs first.** The engine is the product.
3. **Then extend the engine upward**, so a player can learn *advanced* Vim, not
   just beginner Vim. **Breadth is the product**: no artificial cap on commands,
   tips or advanced features. Coverage must stay honest (oracle-tested,
   documented); deferred domains are queued, not rejected.
4. **Optimize**: the game must hit 60 fps on a desktop and stay smooth on a
   cheap phone. Engine/render hot paths are fair game.
5. **UI**: the title screen is loved — keep its soul. The **play space, cursor
   and window chrome** must feel crafted and must **look like Vim/Neovim**, so
   skill transfers. Every stage must state **what you learn and what clears it**
   before the player types.
6. **Leave a precise handoff.** Multiple AIs work in succession; no rediscovery,
   no drift, no "I think this was fixed". This file is that handoff.
7. This program starts with a **5-hour slice** (§5). Everything else is queued,
   not forgotten.
8. **Overlearning is the method.** Mental understanding is not enough; commands
   must be repeated through introduce → drill → transfer → spaced review until
   they are embodied. Boring-but-deliberate repetition is acceptable, but it
   must be **varied repetition**: different text, cursor positions, counts,
   operators, nests and media, so the player adapts to the command itself — not
   rote memorization of one sentence. Do not remove drills in favor of novelty.
9. **The curriculum must be book-derived, not AI-plausible.** The ten
   professional Vim books in `books-text/` are the syllabus authority; every
   stage must trace to a book section and the prerequisite graph must support a
   gradual, nearly painless path. Read
   [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md). The current audit is
   incomplete — do not claim otherwise.

## 1. Invariants — never violate these

- **The engine matches real Vim.** New behaviour needs an oracle case first:
  `node --experimental-strip-types tools/oracle-diff.ts`. Never "fix" a level by
  changing Vim semantics.
- **Every stage passes** `npm run lint:levels` (par, gating, win on last key).
- **No server, no account, no tracking, no runtime dependencies, no secrets in
  the repo.** The deploy token lives in `../.secrets/github_token`; never print
  it, never commit it, always scrub the remote URL after pushing.
- **Keep the render hot path allocation-light.** The composite frame is rebuilt
  only when its key changes (`version|hue|coins|selection|matches|scroll`);
  cursorline, line numbers, cursor, particles and ghost are the FX pass. Do not
  add per-frame allocations or per-frame DOM work to `Renderer.render()`; font
  and color strings should be cached if a profile shows them.
- **English is the game's voice**; Korean is a translation (`Localized.ko`).
- **Docs never drift.** If you add a command, count, or gate, update
  `VIM_COVERAGE.md` / this file in the same commit.

## 2. Verified snapshot (2026-11-11, end of engine pass 2)

| item | value |
|---|---|
| src | 11,458 lines; `engine.ts` 3,590 · `normalize.ts` 100 |
| content | 10 floors · 51 stages · 88 grimoire commands · 12 TRIALS skills |
| engine oracle | **373/373** vs `vim -u NONE` (266 at pass-2 start, +77 cases) |
| level lint | **51/51 stages valid** |
| surface | **86 of 88 commands with engine evidence**, 9 engine-only features, 0 orphan cases (`npm run surface -- --strict`, CI gate) |
| matrix | 21,712 grammar cases: **21,712 matched, 0 divergences** (CI gate; `docs/MATRIX_REPORT.md`) |
| unit tests | **28 pass**; `tsc --noEmit` clean; `doc-check` OK |
| build | JS 242,140 B · single `dist/vimlore.html` 276,101 B · gzip 85,991 B · budget gate 277k/87k (raised this pass) |
| fuzz | 12 seeds at n=1000: **0 divergences** |
| live | <https://jungdonghee.github.io/kiritsu/> · Pages `workflow` · `main` deployed · CI + Pages green |
| deploy auth | fine-grained PAT, repo `admin/push`, API cannot manage Pages; workflow does |

**What changed in pass 2 (engine correctness, the product):**

- Cleared all **14 documented cursor-only fuzz edges**; nine seeds are now
  0-divergence at n=1000 (they are pinned by 373 oracle cases).
- Rebuilt/corrected semantics: multi-line bracket objects are linewise (empty
  pairs park on the close delimiter); backward `(` is built from real sentence
  starts; counted `iw`/`iW` counts space runs as units and skips line breaks;
  `iW` across lines is linewise while `iw` is charwise; case-operator cursor
  rules for backward `gg`, single-line ranges, `^`/`h` zero ranges and
  text-object yanks; the vi linewise conversion for charwise `d` (`2dw`,
  `de`); counted `$` is charwise; shift operator ranges exclude a column-0 end
  line while visual selections include the cursor line; `ap` takes the
  preceding blank at the last paragraph and counted `ap` crosses separators.
- **Surface program (Phase A):** `tools/surface-audit.ts` + generated
  `ENGINE_SURFACE.md`; `--strict` is a CI gate. 88 of 88 Grimoire commands have
  oracle or unit evidence, 9 engine-only features are explicit, 0 oracle cases
  are orphans. CI now also runs the real-Vim oracle and a fuzz smoke.
- **Curriculum correction:** `c04s3` was only passing because the old charwise
  `di(` left the cursor at the end of the opening line. Real Vim parks it on
  the closing-paren line, so the stage now uses `di(kkdi(` (par 8, same goal).
- Budget gate raised deliberately twice: 258k/82k → 260k → **277k/87k**
  (engine correctness + matrix failure semantics); gzip is 85,991 B. See
  HANDOFF §3.

### 2.1 Fuzz results

`tools/fuzz.ts` appends `<Esc>i!<Esc>` and strips the sentinel before comparing,
so a Vim error (which aborts `normal!`) is skipped rather than reported as a bug.

At n=1200 all twelve seeds (7, 11, 23, 31, 47, 101, 131, 173, 211, 5, 999,
1234) report **0 buffer-content and 0 cursor divergences**; the nine documented
seeds are also clean at n=1000. This closes the 14 cursor-only edges that were
open at the start of pass 2 and the two content edges found at n=1200
(visual-block outdent, counted `B` from an empty line). The remaining risk is
Vim's full visual-block virtual-column model, which is covered only for the
shapes the corpus produces; see HANDOFF §2.

## 3. Coverage ladder — what "advanced Vim" means here

> **Engine-completeness program:** the surface manifest, the
> normalization/cursor extraction and the systematic matrix/compose-fuzz gates
> are owned by [`ENGINE_PROGRAM.md`](ENGINE_PROGRAM.md). "Advanced Vim" below is
> feature breadth; ENGINE_PROGRAM is how the covered breadth becomes provably
> complete.

The game is single-buffer by design. We teach the *language of editing*, not
IDE plumbing. Add features in this order; each one ships with oracle cases and
a `VIM_COVERAGE.md` row.

**Tier 0 — already in (do not regress):** motions, operators, text objects,
visual/visual-line/visual-block, search, ex (`:s :g :v :d :m :t :sort :normal
:set gutter`), registers, marks, macros, jumplist, `<C-a>/<C-x>`, undo/redo.

**Tier 1 — this slice (high transfer, single-buffer, oracle-testable):**
- `gn` — select/operate the next search match; composes with `c`, `d`, `.`
  (the `cgn` + `.` workflow is a genuine Vim power tool).
- `g*` / `g#` — search the word under the cursor **without** `\<...\>`.
- Both must work with counts, operators, visual mode and `.` repeat.

**Tier 2 — next slice:**
`g;` / `g,` change list. `\zs`/`\ze`, `gi`/`gI`, interactive `:s///c`, simple
brace-depth `=`/`gg=G` and numeric `:earlier`/`:later` are already implemented.

**Tier 3 — later, only if a stage needs it:**
`zz`/`zt`/`zb` and exact `H/M/L` (needs a viewport model) · folds · completion ·
`:!` / filesystem · quickfix · Vimscript/Lua · windows/splits/buffers/tabs.

**Never:** a server, accounts, telemetry, third-party requests, cloud saves.

## 4. Workstreams and acceptance

### W0 — Engine completeness (owner: engine agent; plan in `ENGINE_PROGRAM.md`)
- Surface manifest + audit: **done (Phase A)** — 86 of 88 commands with evidence, 0 orphans, strict CI gate.
- Normalization extraction: **pilot done (Phase B)** — `normalize.ts` owns `flatRange` + Q02/Q10; `engine.ts` keeps effect dispatch.
- Cursor policy extraction: next (Q04/Q09).
- Matrix + compose-fuzz: systematic grammar coverage, 0 divergences on the taught surface.
- Acceptance: surface 100%, matrix 0 divergences, 12-seed fuzz 0, no silent half-support.

### W1 — Engine correctness (owner: engine agent)
- `tools/fuzz.ts`: seeded differential fuzzer. Random ASCII buffers × random
  valid key sequences from the *implemented* alphabet; one shared `vim -es`
  process, same comparison as the oracle; prints a minimal repro line
  (`text | cursor | keys | vim | engine`). Dev tool, not CI.
- Triage every divergence: real bug → add an oracle case → fix → emit snapshot;
  unsupported feature → exclude from generator and note it.
- Acceptance: fuzz run of ≥1,500 cases with **0 unexplained divergences**;
  oracle ≥373/373; new cases committed; tests green.

### W2 — Advanced coverage (owner: engine agent, after W1)
- `gn` in normal (starts visual selection on next match), operator-pending
  (`dgn`, `cgnTEXT<Esc>`), visual (`gn` extends), counts (`2gn`), and `.` repeat.
- `g*`/`g#`: last-search pattern = `\<word\>` minus the boundaries; direction.
- Acceptance: ≥6 new oracle cases covering normal/visual/operator/count/dot;
  `VIM_COVERAGE.md` updated; `npm test` + lint green.

### W3 — Renderer performance (owner: UI agent)
- Root cause: every frame does a full `clearRect` + full-res layer blit + bloom
  blit at up to 2× DPR. Cache a **single opaque composite frame** (background +
  gutter + `~` + glyphs + bloom + cursorline + numbers) and blit it once per
  frame; draw only selection/matches/ghost/cursor/flash on the FX pass.
  Invalidate the composite on buffer version, hue, coin set, cursor line, or
  resize. Do not clear when the composite is opaque and covers the canvas.
- Keep DPR honest; cap pixel area on huge screens if needed (quality first,
  but 60 fps is the target).
- Acceptance: `pw/perf_local.mjs` desktop ≥50 fps (x1) and phone ≥55 fps;
  no visual regression; idle frames still free.

### W4 — Vim-like play space + explicit objective (owner: UI agent)
- **Window, not a card.** The buffer area reads as a Vim window: tabline on
  top, text starting top-left (not centered in a rounded box), `~` filling
  below EOF, statusline, `:` command line. Keep the CRT tube and phosphor soul.
- **Cursor as a first-class object:** solid block in normal, vertical bar in
  insert, underline in replace, block + selection in visual; blink only when
  the terminal would; redraw the character under the block legibly.
- **Objective clarity, before typing:** the pre-stage card states
  `LEARN` (command keys + name + one-line why, from `stage.teaches` →
  `commands.ts`), `GOAL` (human win condition), `PAR`, `STAGE n/5`.
  The in-play objective bar repeats the lesson and the live target.
- **Transfer:** statusline/`: `cmdline`/mode labels follow Vim conventions;
  no game-only chrome inside the buffer.
- Acceptance: screenshots at desktop + phone; `audit.mjs` gating/stage-1 still
  green; zero page errors; no engine edits.

### W5 — Handoff system (owner: orchestrator/next AI)
- This file is the source of truth for priority. `AGENTS.md` points here.
- `HANDOFF.md` carries only *current state + open bugs*, not history.
- Every session ends with: gates green, build, commit, push (scrub URL), Pages
  success, task board updated.

## 5. This slice — definition of done (5 hours)

| # | deliverable | acceptance |
|---|---|---|
| S1 | fuzz harness + triage | **done** — `tools/fuzz.ts`; seed 7: 0 content diffs |
| S2 | fixed engine bugs | **done** — +171 cases, oracle 373/373, gates green; `gn`/`g*`/`g#` shipped |
| S3 | `gn` / `g*` / `g#` | **done** — 8 cases incl. cgn-dot, visual gn, 2* |
| S4 | renderer composite + fps pass | **done** — desktop 52–57 fps x1, phone 59–60 |
| S5 | Vim-like window + cursor + lesson card | **done** — screenshots + audit green |
| S6 | handoff | **done** — commit `224175d` pushed; CI + Pages green |

If the clock runs out, **stop at a green gate**: commit what passes, move the
rest to the task board. Never commit a red level or a failing oracle.

## Direction: the divine move (2026-11-11)

The engine is exact on the tested surface; the bottleneck is now verified
content. [`DIVINE_MOVE.md`](DIVINE_MOVE.md) owns the three tracks and their
acceptance criteria:

| id | track | status |
|---|---|---|
| DM1 | observable-state oracle (mode/registers/undo/marks) | **in progress** — tool built, 173 open local |
| DM2 | license-safe corpus from Vim tests / VimGolf / book code | queued after DM1 |
| DM3 | level compiler (BFS/A*, necessity + par + citation) | queued after DM2 |
| DM4 | curriculum mastery loops on synthesized drills | after DM3 |

## 6. Task board

| id | task | workstream | status | files |
|---|---|---|---|---|
| D1 | write master plan + handoff protocol | W5 | **done** | `docs/MASTER_PLAN.md` |
| E1 | fuzz harness | W1 | **done** | `tools/fuzz.ts` |
| E2 | triage/fix fuzz divergences | W1 | **done** (seed 7; seeds 11/23 listed above) | `src/core/vim/**`, `tools/cases.ts` |
| E3 | `gn` / `g*` / `g#` | W2 | **done** | `src/core/vim/engine.ts`, `search.ts` |
| E4 | coverage doc + counts | W2 | **done** | `docs/VIM_COVERAGE.md` |
| R1 | composite frame cache | W3 | **done** | `src/ui/render.ts` |
| R2 | cursor shapes by mode | W4 | **done** | `src/ui/render.ts` |
| R3 | Vim window layout | W4 | **done** | `src/ui/render.ts`, `src/style.css` |
| R4 | perf measurement | W3 | **done** | `pw/perf_local.mjs` |
| U1 | lesson card (LEARN/GOAL/CLEAR/PAR/WHY) | W4 | **done** | `src/ui/play.ts`, `src/style.css` |
| U2 | in-play objective bar | W4 | **done** | `src/ui/play.ts` |
| U3 | statusline/cmdline polish | W4 | **done** | `src/ui/play.ts` |
| U4 | screenshots + audit | W4 | **done** | `pw/` |
| U5 | F1 primer + idle coach + keyboard-only audit | W4 | **done** | `src/ui/app.ts`, `src/ui/play.ts`, `src/ui/dom.ts` |
| U6 | in-game settings prompts (no browser dialogs) | W4 | **done** | `src/ui/app.ts`, `src/style.css` |
| E5 | `gI` / `gi` coverage | W2 | **done** | `src/core/vim/engine.ts`, `tools/cases.ts` |
| D2 | refresh AGENTS/HANDOFF | W5 | **done** | `AGENTS.md`, `docs/HANDOFF.md` |
| D3 | final gates + build + push | W5 | **done** | all |
| E6 | clear the 14 cursor-only fuzz edges | W1 | **done** — nine seeds 0 @ n=1000 | `engine.ts`, `cases.ts` |
| E7 | multi-line bracket objects linewise + empty pairs | W1 | **done** | `objects.ts` |
| E8 | backward `(` sentence starts, counted `ap`/`iw` | W1 | **done** | `motions.ts`, `engine.ts` |
| E9 | delete/shift/`$`/case-operator cursor semantics | W1 | **done** | `engine.ts` |
| E10 | visual-block outdent, counted WORD failure | W1 | **done** — 12 of 12 fuzz seeds at n=1000, 0 divergences | `engine.ts` |
| D4 | fix c04s3 to a Vim-valid solution (par 8) | W5 | **done** | `src/content/chapters/c04.ts` |
| D5 | deliberate budget raises (258→260→277k) | W5 | **done** | `tools/bundle-budget.ts`, docs |
| A1 | surface manifest + `surface-audit.ts` | W0 | **done** — strict CI gate | `tools/surface-audit.ts`, `docs/ENGINE_SURFACE.md` |
| A2 | CI native-Vim oracle job | W0 | **done** — oracle + fuzz smoke | `.github/workflows/ci.yml` |
| A3 | extract delete normalization (Q02/Q10) | W0 | **done** — Phase B pilot | `src/core/vim/normalize.ts`, `engine.ts` |
| A4 | extract cursor policy (Q04/Q09) | W0 | **done** | `src/core/vim/cursor.ts`, `engine.ts` |
| C1 | grammar matrix harness (feedkeys semantics) | W0 | **done** — 21,712/21,712, CI gate | `tools/matrix.ts`, `docs/MATRIX_REPORT.md` |
| C2 | close matrix divergences by family | W0 | **done** — 0 divergences | `engine.ts`, `motions.ts`, `objects.ts` |
| ED0 | deferred buffer/file/window architecture | later | **design done** | `docs/FUTURE_EDITOR.md` |

## 7. Handoff protocol (for the next AI)

1. Read §0 and §1. Run `npm run doctor`, then the four gates (§10). Trust the
   gates over any prose, including this file.
2. Claim a task by changing its status to `in progress` **in the same commit**
   as the work. Never work on two workstreams that touch the same file
   concurrently.
3. For engine work: repro first (oracle case or fuzz case), then fix, then
   `--emit`, then all gates. For UI work: screenshot before/after, run
   `pw/audit.mjs`, check page errors.
4. At the end of a session: update §2 and the task board, write what you
   verified and what you did **not** verify in `HANDOFF.md`, commit, push,
   scrub the remote URL, confirm the Pages run.
5. If a task is too big for one session, split it in the board; do not silently
   leave it "in progress".

## 8. Risks and decision log

- **Fuzz noise** can drown real bugs: keep the generator inside the implemented
  alphabet; an unsupported construct is excluded, not "fixed" in the engine.
- **UI/perf conflict**: one owner for `src/ui/render.ts` at a time. Perf first,
  then visual polish, then re-measure.
- **Scope creep**: no stages in this program; no server, no plugin system. New
  chapters are allowed only after Tier 2 coverage is green. Buffers/files/splits/
  tabs are a deliberate later editor program — **design and phases in
  [`FUTURE_EDITOR.md`](FUTURE_EDITOR.md)**; never fake `:b`/`:sp` by mutating the
  single `buf`.
- **Doc drift**: the oracle count, command count and perf numbers are checked
  by `doc-check` only partially; update them by hand in the same commit.
- **Curriculum drift**: a plausible level is not a book-derived level. Every
  curriculum change needs a section citation and a prerequisite check; see
  `CURRICULUM_PROVENANCE.md`. Do not “fix” a gap by inventing a lesson.
- **Novelty drift**: a new puzzle is not progress if it replaces deliberate
  repetition. Commands must be drilled and revisited; see §4 of the provenance
  doc.
- **Deploy**: Pages builds from `main`; a broken build blocks the live site.
  Build locally before pushing.
- **Budget (pass 2 decision)**: the raw/gzip ceiling was raised 258k/82k →
  277k/87k in the same commit as the engine work (+2.9 kB for 30 pinned
  behaviours; gzip 85,991 B). Headroom is ~900 B raw. The next feature must
  reduce bytes or justify another measured raise; do not raise it silently.

## 9. Deferred editor program

Buffers (`:ls/:b/:bn/:bp/:bd/:bufdo`, alternate `#`, hidden), files
(`:e/:r/:w file` over a browser VFS), splits, tabs and `<C-w>` are **not** in the
current slice. The concrete architecture, phases, invariants and tests are in
[`FUTURE_EDITOR.md`](FUTURE_EDITOR.md). Do not start Phase A until Tier 2 and the
cursor-only fuzz backlog are green.

## 10. Command reference (unchanged)

```bash
cd /home/jung/ai_station/sandbox/vimlore
npm run doctor
npm test
npm run lint:levels
npx tsc --noEmit
npm run doc-check
node --experimental-strip-types tools/oracle-diff.ts        # 373/373
node --experimental-strip-types tools/oracle-diff.ts --emit # snapshot
node --experimental-strip-types tools/fuzz.ts --n=1500 --seed=7
npm run build
cd /home/jung/ai_station/sandbox && node pw/audit.mjs
node pw/perf_local.mjs
```
