# HANDOFF — VIMLORE current state

> **Priority and the task board live in [`MASTER_PLAN.md`](MASTER_PLAN.md).**
> This file is the snapshot a new AI needs in the first ten minutes: what is
> true now, what is broken, and which traps cost the last session hours.
> For a single copy-paste start, use [`ONE_MESSAGE.md`](ONE_MESSAGE.md) or run
> `npm run kickoff`.
> **Last rewritten:** 2026-11-11, end of the engine-correctness pass (pass 2).

## 0. Snapshot (engine pass 2)

| item | value |
|---|---|
| repo | `/home/jung/ai_station/sandbox/vimlore` · GitHub `JungDonghee/vimlore` · `main` |
| live | <https://jungdonghee.github.io/vimlore/> (Pages `workflow`) |
| content | 10 floors · 51 stages · 86 grimoire commands · 12 TRIALS skills |
| engine | 3,509 lines + `normalize.ts` 100; **363 oracle cases**, all matching real Vim (strict) |
| gates | oracle 363/363 · surface 86 of 86 evidence, 0 orphans (`--strict`) · level lint 51 stages valid · unit tests 34 pass · tsc 0 · doc-check OK · invariants 0 errors / 15 warnings |
| build | JS 242,140 B · single `dist/vimlore.html` 268,117 B · gzip 84,292 B · budget gate 269k/86k (raised deliberately this pass, §3) |
| fuzz | 12 seeds at n=1000: **0 divergences**; n=3000: 10/12 clean, 2 seeds hit visual-block/`dW`-blank edges (below) |
| matrix | 21,712 grammar cases: **21,712 matched, 0 open** (CI gate; `docs/MATRIX_REPORT.md`) |
| state matrix | 21,712 command trees with register/undo: **21,503 matched, 209 open** (local DM1; `docs/STATE_REPORT.md`) |
| deploy | `main` deployed; CI + Pages green; verify with `git ls-remote origin refs/heads/main` |

If any number here disagrees with a fresh gate run, **the gate wins** — update
this file.

## 1. What pass 2 delivered

### The 14 cursor-only fuzz edges are gone
All nine documented seeds (7/11/23/31/47/101/131/173/211) now report **0
divergences at n=1000**, buffer and cursor. The previously documented repros
(`3g~gg`, `2gUG`, `>ap`, `gUgg`, `2gu(`, `yi(`, `di{`, `<C-v>b(>`, `2guiw`,
`2gUaw`, …) are pinned by oracle cases and pass. Do not re-fix them from prose;
run the gates.

### Engine semantics fixed (all oracle-pinned)
- **Multi-line bracket objects are linewise** when the opening bracket ends a
  line and the closing one starts a line: `di{` removes whole inner lines and
  leaves the braces on their own lines; `ci{` opens an empty line. Adjacent
  `{`/`}` pairs are a no-op that parks on the close bracket. Empty pairs
  (`f()`, `""`) are no-ops that move the cursor to the closing delimiter, and
  `ci(`/`ci"` insert before it.
- **Backward sentence motion `(`** is rebuilt from real sentence starts:
  BOF, the last blank line of a blank run, paragraph starts, and the first
  non-blank after `[.!?]` + whitespace. Counted `(` that runs out fails as a
  no-op (and `c(` still opens insert).
- **Counted `iw`/`iW`** now counts units: a space run is a unit, a line break
  is skipped but kept in the range, and an adjacent punctuation token is the
  next unit (`2diw` on `(` eats `(x`; `2diw` on the last word keeps its trailing
  space). Counted `iW` across lines is linewise; `iw` stays charwise.
- **Case-operator cursor rules**: a backward linewise motion lands in the
  motion's column (`gg` first non-blank, `k` same column); a single-line range
  uses min(column, first non-blank); text-object yanks land at column 0; a
  zero-range `^`/`h` at column 0 of a non-first line is linewise, while line 1
  toggles one character.
- **Delete vi-compatibility**: a charwise `d` spanning lines that ends at the
  end of its last line and starts in the indent becomes linewise (`2dw`, `de`);
  `c`/`y` stay charwise. A counted `$` is now charwise; only `d` converts.
- **Shift ranges**: a charwise range ending at column 0 of a later line does
  not shift that line (`>b`, `>W`, `3>B`); visual selections do include the
  cursor line; visual-block shifts keep all block lines.
- **`ap` at the last paragraph** now takes the preceding blank run; counted
  `ap` crosses separators and includes surrounding blanks (`2cip`, `2dap`,
  `2yap`, `2g~ap`).

### Grammar matrix (Phase C, done)
`tools/matrix.ts` generates 21,712 valid command trees (motion/object ×
operator × mode × count over boundary-rich texts) and diffs them with
`feedkeys('xt')`, so Vim errors do not swallow later keys — the comparison is
the user-observable final buffer + cursor. Current run: **21,712 / 21,712
matched, 0 divergences**. The last families closed were `b`/`B` backward
ranges (linewise at the first non-blank, charwise otherwise), `d)` linewise
end, blank-line `w`/`W`/`$` conversion, and visual-block `<` after `G`. The
matrix runs in the CI `oracle` job now, so a grammar regression fails the
build. Next: compose-fuzz (random command trees) and the cursor-policy
extraction (`cursor.ts`).

### Normalization and cursor extraction (Phase B, done)
`src/core/vim/normalize.ts` owns `flatRange` and Q02 (delete linewise
conversion) / Q10 (backward column-0 ranges). `src/core/vim/cursor.ts` owns the
Q04 (zero-range `0`/`^`/`h` case motions) and Q09 (case-operator landing) policy.
`applyOp`/`caseRange` call both modules and keep only effect dispatch; oracle
363/363 and matrix 21,712/21,712 stayed green through the extraction.

### Surface program (Phase A)
`tools/surface-audit.ts` maps the Grimoire, chapters, oracle cases, unit tests
and TRIALS into one evidence report, now a **strict CI gate**
(`npm run surface -- --strict`). 86 of 86 commands have oracle or unit evidence
(8 ex/macro/mark/format commands are unit-only because `normal!` cannot drive
them), 9 engine-only features are explicit, and 0 of the 363 oracle cases are
orphans. The generated view is [`ENGINE_SURFACE.md`](ENGINE_SURFACE.md); the
program is [`ENGINE_PROGRAM.md`](ENGINE_PROGRAM.md). Curriculum gaps (15
grimoire-only, 12 unused in solutions) are reported separately.

### Curriculum correction forced by the engine
`c04s3` used `solution: 'di(kdi('`, par 7. It only passed because the old
charwise `di(` left the cursor at the end of the opening line. Real Vim parks
the cursor on the closing-paren line, so the next `k` went to the wrong call.
The stage now uses `di(kkdi(`, par 8, with the same goal; `lint:levels` and a
real Vim run both agree. This is a **level** fix, not an engine fix.

## 2. Engine divergence status

**The fuzz corpus is clean.** Twelve seeds at n=1200 (7, 11, 23, 31, 47, 101,
131, 173, 211, 5, 999, 1234) report **0 buffer-content and 0 cursor
divergences**; the nine documented seeds are also clean at n=1000. Every fix
from this pass is pinned by an oracle case (352 total), so a regression fails
the oracle before it can reach a level.

The last two edges were closed by:

1. **Backward column-0 ranges**: a charwise range whose cursor sits at column 0
   (e.g. `cB`/`dB`/`yB` from an empty line) contributes no characters on the
   start line, so Vim operates linewise on the lines above it. This is now a
   general rule, not a `B` special case.
2. **Visual-block outdent on short lines**: when the anchor is right of column
   0, the block's left edge is 0, and a line is too short to reach `c2`, Vim
   shrinks the block to start at column 1. The engine applies that clamp for
   `<` only; it is pinned by five oracle cases (anchors 0/2/3, motion-formed
   anchor 0, and the no-indent cursor case).

What is still an approximation: Vim's full visual-block virtual-column model
(`start_vcol`, short lines, tabs). The oracle covers the shapes the fuzzer and
levels produce, but a new block geometry can still surprise. Add an oracle case
before changing `shiftRange`, `selection()` or `block_prep`-equivalent code.

## 3. Budget decision (deliberate)

CI has failed twice on this gate and **never on the oracle**: c61b2c4 emitted
83,051 B gzip against an 83,000 ceiling (local: 82,305), and 6686cbe emitted
84,088 B against 84,000 (local: 83,282). Both were zlib-build variance, not a
grammar regression; the ceilings were raised with the measured numbers above.


Deliberate raises as engine work landed: 258,000/82,000 → 260,000 → 262,000 →
264,000 → **269,000/86,000**. Each was measured and committed with the feature
that needed it. Current build is 268,117 B raw / 84,292 B gzip, so headroom is
~700 B raw / ~800 B gzip: the next feature must reduce bytes first or justify
another measured raise. Phase E is where bytes get reclaimed, not a permanent
escalation.

## 3b. Engine review (2026-11-11, after matrix 0)

Static pass over `buffer.ts`, `engine.ts`, `motions.ts`, `objects.ts`, `ex.ts`,
`search.ts`, plus a 12-seed n=3000 fuzz run. Fixed the severe holes and pinned
each with an oracle case (356 → 363):
- `>W` at EOL shifted the next line's indentation too (Vim shifts only the
  current line): charwise shift ranges now drop a final line that is all indent.
- `ciw`/`ciW` on an empty line deleted the newline and joined the next line;
  the empty-line word object is now `empty` and inserts in place.
- `da"` left a space when there was no trailing whitespace (Vim takes the
  preceding run); `2di"` then trimmed that run back to the quote pair.
- `V{`/`V}` yank cursor and `<C-v>}` block outdent matched Vim now.

Known edge divergences (not taught, recorded but not fixed): `<C-v>)` block
geometry on multi-line/short lines, `dW` on a blank line, and a one-column block
`<` cursor after `j`. They are outside the current curriculum; do not fake a
fix in a level.

### Play UX: exit prompt, previous stage, map polish (2026-11-11)

- **Esc is Vim's Esc again** — never exits. Leaving mid-play uses the
  **F10/× LEAVE prompt** (CANCEL focused first, LEAVE confirms); Esc closes the
  prompt without leaving.
- **F9 / tabline ‹ / results PREV** go to the previous chamber when one exists.
- The map's floor story now expands/collapses smoothly (max-height/opacity
  transition) instead of snapping display on/off.
- Keyboard j on the last floor pins the map scroller to the bottom after the
  story transition, matching the mouse wheel's maximum scroll (the 38 px bottom
  padding was the old gap).

**Known curriculum/gating debt (deliberately deferred):** chapter-wide unlock
keys can expose a skill before a stage teaches it, and 12 unlock keys have no
Grimoire row. Book-derived curriculum/provenance will fix the ordering; do not
paper over it with ad-hoc locks now.

### Ghost mode: fresh replay, exact restore (2026-11-11)

F3 now builds a **fresh Session seeded from the stage's initial text** and plays
the solution there with `demo` set (no key count, hazard, pickup or win). The
player's live Session is never fed, so an edited buffer cannot corrupt the
demo, and after the replay the **same live Session object is restored verbatim**
(buffer, cursor, undo stack, registers, keys, mode). No restart is performed.
The live Vim version is bumped so the renderer frame cache rebuilds. The next
overlay can never appear from a ghost run; Enter stays ignored while ghosting.

### Tab in insert mode (2026-11-11)

Fixed a real gameplay bug: the play screen intercepted Tab for the hint even in
insert mode, so `i` + Tab typed no spaces. Tab now reaches the engine in
insert/replace (it expands to spaces to the next tabstop, 4); outside those
modes it still opens the hint. Unit-tested.

## 3c. Next direction (the divine move)

The engine is no longer the bottleneck. See [`DIVINE_MOVE.md`](DIVINE_MOVE.md):
(1) observable-state oracle (mode/registers/undo/marks, not just buffer+cursor),
(2) a license-safe corpus generated from Vim's own tests / VimGolf / book code,
(3) a level compiler that proves command necessity and par by search, then
shifts the roadmap to curriculum mastery loops. Engine features freeze except
oracle/corpus failures.

### DM1 status (2026-11-11, first autonomous slice)

`tools/state-matrix.ts` exists (local, not CI): it runs the matrix command
trees and compares buffer, cursor, unnamed register text/type, and the state
after `u`. Mode is **not** comparable through `vim -es` (`mode()` reports `c`);
a pty/Nvim probe would be needed, so mode is out of this report.

First full run: 15,289/21,712 matched, 6,423 divergences. Latest:
**21,503/21,712 matched, 209 open** (undo 627, register 18). Fixed:
- a real operator leak: several `c` paths opened insert without clearing `op`,
  so the next key (including `u`) was swallowed — `c{` at BOF then `u` did not
  undo. `openInsertAt` now ends the operator composition.
- undo cursor: engine now derives it from the first changed position, with
  linewise delete/change and shift overrides; undo cursor mismatches dropped
  and the 4 new oracle cases (363 → 363) pass.

After those fixes: **21,503/21,712 matched, 209 open**, dominated by
`undo` cursor policy (941), plus register type/text (19+13). The tool stays
local until the generated set reaches 0; the report is `docs/STATE_REPORT.md`.

## 4. Not done (queued, do not pretend otherwise)

- **Curriculum provenance**: 5/51 stages cited, 46 unmapped. The audit is
  incomplete; see `CURRICULUM_PROVENANCE.md` and `STAGE_PROVENANCE.md`.
- **Invariants**: 15 coverage warnings (commands never declared by a stage /
  unlock keys without a Grimoire row), 0 errors. Not hidden; not yet resolved.
- **Real-GPU 60 fps**: headless desktop is 52–57 fps; the headless browser is
  the ceiling (trap 9). Needs a real GPU browser measurement.
- **Change list** (`g;`/`g,`) and the editor program (buffers/files/splits/
  tabs, folds, completion, viewport motions) are **deferred, not out of
  scope**: they are backlog phases, designed in `FUTURE_EDITOR.md` where
  applicable. They are simply not in today's taught surface yet.
- **CI**: now runs tests, lint, tsc, docs, invariants, surface `--strict`,
  build, budget **and the real-Vim oracle + a fuzz smoke** (`oracle` job).
  Browser audit and perf still run locally only; local proof is still stronger.
- **Docs**: `doc-check` guards oracle counts/links and several numbers, not all
  prose. If a number disagrees with a fresh gate, the gate wins.

## 5. Traps that cost time

1. **The oracle is one shared Vim process.** `clearjumps` does not fully stop
   jumplist leakage; never add `<C-o>`/`<C-i>` cases to `tools/cases.ts`
   (verify one process per case instead).
2. **`execute "normal! ..."` aborts at the first error.** The fuzzer appends
   `<Esc>i!<Esc>` and strips the sentinel; without it, most "failures" are
   Vim stopping early. Keep that mechanism.
3. **Snapshot drift.** After adding/removing a case:
   `node --experimental-strip-types tools/oracle-diff.ts --emit` rewrites
   `tests/vim-expected.json`; otherwise `npm test` fails on a count mismatch.
4. **Gating has one truth:** `Session.keyAllowed()`, enforced through `Vim.gate`
   on every path (`:normal`, replay, macros). Do not add a second check.
5. **`docs/LEVELS.md` is generated** by `tools/gen-docs.ts`; don't hand-edit.
6. **Doc numbers are checked only partially.** Oracle counts/links are gated;
   command/stage/perf numbers are not. Update them in the same commit.
7. **Renderer rule:** the composite frame key is
   `version|hue|coins|selection|matches|scroll`. If you add a pixel that
   depends on something else, add it to the key or draw it on FX.
8. **Overlay stacking:** `.overlay` is `z-index: 70`, above the CRT scanlines
   (60) and beam (61); do not lower it or the briefing goes soft.
9. **Desktop fps ceiling is the headless browser, not the renderer.** At
   1280×800 the headless shell caps rAF around 54–57 fps even with the game
   canvas hidden and CRT off. Use `perf_local.mjs` for *relative* regressions;
   verify 60 fps on a real GPU browser.
10. **A new command without evidence fails `surface --strict`.** Add oracle
    cases (or a unit test when `normal!` cannot drive it) and, if it has no
    Grimoire row, add it to `ENGINE_ONLY` in `tools/surface-audit.ts`.
11. **Security:** PAT at `/home/jung/ai_station/sandbox/.secrets/github_token`
    (mode 600, outside the repo). Never print/commit it; scrub the remote URL
    after pushing. A red build on `main` breaks the live site.

## 6. Gates and commands

```bash
cd /home/jung/ai_station/sandbox/vimlore
npm run doctor
npm test
npm run lint:levels
npx tsc --noEmit
npm run doc-check
npm run invariants
npm run surface -- --strict
npm run matrix                                            # 21,712/21,712 (CI gate)
node --experimental-strip-types tools/oracle-diff.ts        # 363/363
node --experimental-strip-types tools/oracle-diff.ts --emit # snapshot
node --experimental-strip-types tools/fuzz.ts --n=1000 --seed=7
npm run build
npm run budget
cd /home/jung/ai_station/sandbox && node pw/audit.mjs && node pw/perf_local.mjs
```

Playwright/perf need the repo build served at `http://localhost:8138` (sandbox
root). `audit.mjs` checks gating + stage 1; `perf_local.mjs` measures desktop and
phone under CPU throttling.

## 7. Deploy

```bash
cd /home/jung/ai_station/sandbox/vimlore
git add -A && git commit -m "…"
TOKEN=$(cat /home/jung/ai_station/sandbox/.secrets/github_token)
git push --dry-run "https://x-access-token:$TOKEN@github.com/JungDonghee/vimlore.git" main:main
git push "https://x-access-token:$TOKEN@github.com/JungDonghee/vimlore.git" main:main
git remote get-url origin   # must be the clean URL, no token
```

Confirm the `pages` workflow and that <https://jungdonghee.github.io/vimlore/>
serves the new asset hash.

## 8. If you only have one hour

1. Run the gates (§6) and record the real numbers.
2. Fix one §2 edge (visual-block outdent or counted WORD motion) with an oracle
   case first.
3. Do not start a second workstream that touches the same files.
4. Leave the tree green, update `MASTER_PLAN.md` §2/§6 and this file, commit.
