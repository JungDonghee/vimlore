# HANDOFF — VIMLORE current state

> **Priority and the task board live in [`MASTER_PLAN.md`](MASTER_PLAN.md).**
> This file is the snapshot a new AI needs in the first ten minutes: what is
> true now, what is broken, and which traps cost the last session hours.
> **Last rewritten:** 2026-11-11, end of completion-program slice 1.

## 0. Snapshot (after slice 1)

| item | value |
|---|---|
| repo | `/home/jung/ai_station/sandbox/vimlore` · GitHub `JungDonghee/vimlore` · `main` |
| live | <https://jungdonghee.github.io/vimlore/> (Pages `workflow`) |
| content | 10 floors · 51 stages · 84 grimoire commands · 12 TRIALS skills |
| engine | 2,532 lines; **205 oracle cases**, all matching real Vim |
| gates | oracle 205/205 · level lint 51 stages valid · unit tests 23 pass · tsc 0 · doc-check OK |
| build | JS 210,220 B · single `dist/vimlore.html` 231,530 B · gzip 74,651 B |
| perf (headless) | desktop 1280×800 **56 fps** (x1), 48 (x4) · phone 844×390 59–60 (x4), 57–60 (x6) |
| deploy | last deployed commit is `f5eec60`; slice 1 is pushed after this snapshot |

If any number here disagrees with a fresh gate run, **the gate wins** — update
this file.

## 1. What slice 1 actually delivered

### Engine correctness (the big win)
- `tools/fuzz.ts` added: seeded differential fuzzer, one shared `vim -es`
  process, sentinel-based detection of Vim aborts. `npm run fuzz`.
- **63 new oracle cases** (142 → 205): operator ranges with `gg`/`G`/`{`/`}`,
  counts on doubled operators (`3>>`, `3g~~`, `2J`), visual-block `~`/`>`/`<`,
  visual `f/F/t/T`, `cw`/`cW`/text-object edges, `y`/`P` cursor rules, join
  stripping, sentence/paragraph boundaries, block `$`.
- Seed 7 fuzz: **71 → 2 divergences, 0 buffer-content**. Seeds 11/23 find a
  handful of remaining word/visual edges (listed in `MASTER_PLAN.md` §2.1).

### UI / renderer
- `Renderer` now bakes one **opaque composite frame** (background, highlights,
  numbers, glyphs, bloom) and blits it once per frame; FX is cursor, ghost,
  particles, flash. Desktop **23.5 → 56 fps**; phone stable at 59–60.
- Play screen is a **Vim window**: text starts top-left, `~` fills to the
  statusline, no rounded game card, cursorline, tabline, statusline.
- **Cursor shapes**: block (normal), vertical bar (insert), underline
  (replace), hollow block + selection (visual); no buffer cursor while the
  command line is open.
- **Briefing contract**: `LEARN` (keys + name + description for up to 4
  commands), `GOAL`, `CLEAR` (human win condition), `PAR`, `WHY`. The in-play
  bar repeats `LEARN <keys>` + the live goal.
- `:`/`/` echo with a command-line cursor; overlays sit above the CRT
  scanlines so briefing text is crisp (this was a real readability bug).
- Landscape 844×390 uses a two-column briefing so BEGIN is above the fold.

### Not done (queued, do not pretend otherwise)
- `gn` / `g*` / `g#` (Tier 1 advanced coverage). This is the next engine task.
- Change list (`g;`/`g,`), `:s///c`, `\zs/\ze`, `gi`, `=` indent.
- Remaining cross-seed fuzz edges (seed 11: `dt(`, `2cw`, `cw`; seed 23:
  visual `vk$d`/`vlB<`, block `U`, `3cW`, `2daW`).
- Curriculum metadata holes (9 stages with `teaches: []`; 18 grimoire commands
  never declared; `c02s5` promises a `t`-vs-`f` lesson but uses only `f`/`;`).
- `progress.ghost` dead field; version/tag mismatch; chapter title casing.
- CI has no real `vim` job and no browser/perf gate; fuzz is local-only.
- Doc drift outside the numbers fixed in this slice (see §2).

## 2. Open product gaps

- **Coverage** is a chosen subset: no windows/splits/buffers/tabs, folds,
  completion, `:!`/filesystem, quickfix/LSP, Vimscript/Lua, `:s///c`, undo tree,
  change list, viewport motions (`zz/zt`, exact `H/M/L`), filters.
- **Curriculum truth**: `level-lint` checks par/gating/win but not
  teaches↔solution↔unlocks coherence. `c02s5` is named CONFIG and should either
  implement the `t`-vs-`f` lesson or stop claiming it.
- **Performance headroom**: x4-throttled desktop is 47–48 fps. A real GPU
  should be better, but the next perf step is dirty-rect cursor blits or
  offloading scanlines/bloom to CSS.
- **Docs**: README/EVALUATION/AGENTS still carry a few stale claims; `doc-check`
  only guards oracle counts and links.
- **Security**: the PAT has repo `admin/push`, outside the repo, never printed.
  The account is AI-purpose; rotation is not required, leakage is unacceptable.

## 3. Traps that cost time

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
7. **Renderer rule (new):** the composite frame key is
   `version|hue|coins|cursor.line|numbers|selection|matches`. If you add a
   pixel that depends on something else, add it to the key or draw it on FX.
8. **Overlay stacking:** `.overlay` is `z-index: 70`, above the CRT scanlines
   (60) and beam (61); do not lower it or the briefing goes soft.
9. **Security:** PAT at `/home/jung/ai_station/sandbox/.secrets/github_token`
   (mode 600, outside the repo). Never print/commit it; scrub the remote URL
   after pushing. A red build on `main` breaks the live site.

## 4. Gates and commands

```bash
cd /home/jung/ai_station/sandbox/vimlore
npm run doctor
npm test
npm run lint:levels
npx tsc --noEmit
npm run doc-check
node --experimental-strip-types tools/oracle-diff.ts        # 205/205
node --experimental-strip-types tools/oracle-diff.ts --emit # snapshot
node --experimental-strip-types tools/fuzz.ts --n=1500 --seed=7
npm run build
cd /home/jung/ai_station/sandbox && node pw/audit.mjs && node pw/perf_local.mjs
```

Playwright/perf need the repo build served at `http://localhost:8138` (sandbox
root). `audit.mjs` checks gating + stage 1; `perf_local.mjs` measures desktop and
phone under CPU throttling.

## 5. Deploy

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

## 6. If you only have one hour

1. Run the gates (§4) and record the real numbers.
2. Fix the highest-value open bug on the board (currently `gn`/`g*`/`g#`, or a
   seed-11/23 fuzz content case) — oracle case first.
3. Do not start a second workstream that touches the same files.
4. Leave the tree green, update `MASTER_PLAN.md` §2/§6 and this file, commit.
