# MASTER PLAN — VIMLORE completion program

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

## 2. Verified snapshot (2026-11-11, end of slice 1)

| item | value |
|---|---|
| src | 9,365 lines; `engine.ts` 2,532 lines |
| content | 10 floors · 51 stages · 86 grimoire commands · 12 TRIALS skills |
| engine oracle | **266/266** vs `vim -u NONE` (142 at session start, +124 cases) |
| level lint | **51 stages valid** |
| unit tests | **24 pass**; `tsc --noEmit` clean; `doc-check` OK |
| build | JS 231,540 B · single `dist/vimlore.html` 255,330 B · gzip 81,368 B · budget gate 258k/82k |
| perf (headless) | desktop 1280×800: **52–57 fps** (x1), 51–53 (x4) · phone 844×390: 59–60 (x4), 57–60 (x6) |
| live | <https://jungdonghee.github.io/vimlore/> · Pages `workflow` · `main` deployed · CI + Pages green · verify with `git ls-remote origin refs/heads/main` |
| deploy auth | fine-grained PAT, repo `admin/push`, API cannot manage Pages; workflow does |

**What changed in slice 1:** a seeded differential fuzzer (`tools/fuzz.ts`),
124 new oracle cases and a large engine-correctness pass (operator ranges with
`gg`/`G`/`{`/`}`, counts on doubled operators, visual-block `~`/`>`/`<`,
word/sentence/paragraph edges, visual find `f/F/t/T`, `vlB<`, `2daW`); a
composite-frame renderer (**23.5 → 52–57 fps** desktop); `gn`/`g*`/`g#`,
`gI`/`gi`, `\zs`/`\ze`, interactive `:s///c` and simple brace-depth `=`; a
Vim-like top-left window with `~` fill,
mode-specific cursor (block/bar/underline), crisp overlays, command-line echo,
an explicit **LEARN / GOAL / CLEAR / PAR / WHY** briefing and a results **DRILL**
cue for varied repetition; Vim-style horizontal/
vertical viewport scrolling; an **F1 primer**
on every screen and an auto-**coach** after idle/locked/damage.

### 2.1 Fuzz results and remaining divergences

`tools/fuzz.ts` appends `<Esc>i!<Esc>` and strips the sentinel before comparing,
so a Vim error (which aborts `normal!`) is skipped rather than reported as a bug.

| seed | matched | skipped | divergences | buffer-content |
|---:|---:|---:|---:|---:|
| 7 | 683 | 317 | **0** | **0** |
| 11 | 662 | 338 | **0** | **0** |
| 23 | 651 | 349 | **0** | **0** |
| 31 | 644 | 351 | **5** | **0** |
| 47 | 682 | 318 | **0** | **0** |
| 101 | 634 | 361 | **5** | **0** |
| 131 | 670 | 325 | **5** | **4** |
| 173 | 630 | 370 | **0** | **0** |
| 211 | 666 | 329 | **5** | **1** |

**Seeds 7/11/23 are completely clean; seeds 31/47/101 have 0 content edges.**
Seeds 131/211 expose the remaining content frontier: `2diw`/`2diW`, `2caw`,
`g~0`, `3ciw`. `d)`, `3gUh`/`g~h` are now oracle-covered and fixed; seed 173
is fully clean. Treat the clean
set as a regression corpus, not proof of total coverage.
Also fixed: backward sentence motion at blank lines (`V(y`), `2yaW`, `<i(`
empty-object shift, `vlB<`, `Vku`, `gUap`, `dt(`, `2cw`/`cw`, `3cW`, visual
`$`, case-change cursors, block virtual column, `2daW`/`2daw`, `d$` on an
empty line.

Remaining cursor-only repros: `3g~gg`, `2gUG`, `>ap`, `gUgg`, `2gu(`, `yi(`,
`di{`, `<C-v>b(`/`w>`, `2guiw`, `2gUaw`. No content repros remain in the
nine-seed corpus. Fixed this pass: counted
`iW` across lines, counted around-word from whitespace (`2daw`/`3gUaw`), `2ciw`,
`d$`, `=`/`gg=G`, `3gUh`/`g~h`, `d)`, `yk`/`yj`, `guu`, `2)`, `2caw`, `2diw`/`2diW`, `3ciw`,
`di{` content, `gU{`, `gUaW`, backward `dFa`/`gUF`. The oracle/fuzz harness uses
`expandtab`, matching the game's space indent; c04s3 now expects Vim's real
multi-line `di(` result.

## 3. Coverage ladder — what "advanced Vim" means here

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

### W1 — Engine correctness (owner: engine agent)
- `tools/fuzz.ts`: seeded differential fuzzer. Random ASCII buffers × random
  valid key sequences from the *implemented* alphabet; one shared `vim -es`
  process, same comparison as the oracle; prints a minimal repro line
  (`text | cursor | keys | vim | engine`). Dev tool, not CI.
- Triage every divergence: real bug → add an oracle case → fix → emit snapshot;
  unsupported feature → exclude from generator and note it.
- Acceptance: fuzz run of ≥1,500 cases with **0 unexplained divergences**;
  oracle ≥266/266; new cases committed; tests green.

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
| S2 | fixed engine bugs | **done** — +124 cases, oracle 266/266, gates green; `gn`/`g*`/`g#` shipped |
| S3 | `gn` / `g*` / `g#` | **done** — 8 cases incl. cgn-dot, visual gn, 2* |
| S4 | renderer composite + fps pass | **done** — desktop 52–57 fps x1, phone 59–60 |
| S5 | Vim-like window + cursor + lesson card | **done** — screenshots + audit green |
| S6 | handoff | **done** — commit `224175d` pushed; CI + Pages green |

If the clock runs out, **stop at a green gate**: commit what passes, move the
rest to the task board. Never commit a red level or a failing oracle.

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
node --experimental-strip-types tools/oracle-diff.ts        # 266/266
node --experimental-strip-types tools/oracle-diff.ts --emit # snapshot
node --experimental-strip-types tools/fuzz.ts --n=1500 --seed=7
npm run build
cd /home/jung/ai_station/sandbox && node pw/audit.mjs
node pw/perf_local.mjs
```
