# AGENTS.md — read this first

> **진행 중인 작업을 이어받는 중이라면** [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md),
> [`docs/PROMPT_SYSTEM.md`](docs/PROMPT_SYSTEM.md), [`docs/CURRICULUM_PROVENANCE.md`](docs/CURRICULUM_PROVENANCE.md)를
> 먼저 읽어라. **우선순위·5시간 슬라이스·태스크 보드·인수인계 규칙은 그 파일이
> 소유한다.** 그다음 [`docs/HANDOFF.md`](docs/HANDOFF.md)(현재 상태·열린 버그)와
> [`docs/EVALUATION.md`](docs/EVALUATION.md)(리스크·완성 전략)를 읽어라.
> 이 파일은 영속 불변식이다.

VIMLORE is a **Vim teaching game**. The player is a cursor inside a text
buffer and plays with *real Vim keys*. It must feel like a game, not a course.

This file is the map for any AI (or human) continuing the project.

## The one invariant

**The engine must behave like real Vim.** Every command a level uses is
executed by `src/core/vim/engine.ts`, and that engine is diff-tested against a
real `vim` binary (`tools/oracle-diff.ts`). If you change motions, operators or
text objects:

```bash
node --experimental-strip-types tools/oracle-diff.ts   # 373/373 must pass
npm test
```

Never "fix" a level by changing the engine's Vim semantics. Fix the level.

## Commands

```bash
npm install            # vite + typescript only (2 dev deps)
npm run dev            # http://localhost:5173
npm run build          # dist/ + single-file dist/vimlore.html
npm run lint:levels    # validate EVERY stage (par, solution, gating, win)
npm run lint:levels -- 4   # just chapter 4
npm test               # unit tests (engine + goals + progress)
npm run doc-check      # doc numbers/links must match the code (CI gate)
npm run invariants     # cross-layer command/stage/unlock consistency (CI gate)
npm run surface        # engine surface audit; --strict is a CI gate
npm run matrix         # grammar matrix vs real Vim (CI gate)
npm run verify         # unit + lint + tsc + docs + invariants
npm run fuzz           # seeded differential fuzzer (local, needs vim)
node --experimental-strip-types tools/oracle-diff.ts   # vs real vim
npm run trace -- --case=m-1234   # per-prefix differential trace (local)
```

`npm run lint:levels` is the safety net: it replays each stage's `solution`
through the engine, with that chapter's unlock gate, and asserts the stage is
won on the last keystroke in exactly `par` keys. **Never commit red levels.**

## Where things live

```
src/core/vim/       the emulator (buffer, motions, objects, ex, normalize, cursor, engine)
src/core/game/      session (hearts, keys, coins), goals, progress types
src/content/        commands.ts (the Grimoire) + chapters/cNN.ts (the game)
src/ui/             canvas renderer, screens, WebAudio sfx
tools/              level linter, vim oracle, single-file inliner
docs/               LEVEL_FORMAT.md (authoring), CURRICULUM.md (the 10 floors)
```

## Adding content

- **A stage**: edit `src/content/chapters/cNN.ts`. Read `docs/LEVEL_FORMAT.md`
  and [`docs/CURRICULUM_PROVENANCE.md`](docs/CURRICULUM_PROVENANCE.md) + [`docs/BOOKS_INDEX.md`](docs/BOOKS_INDEX.md). Every
  stage must cite a source-book section and fit the prerequisite graph; start
  from `docs/STAGE_PROVENANCE.md` (all rows are unmapped) and `docs/BOOKS_INDEX.md`;
  never invent a plausible lesson. Run `npm run lint:levels -- NN` until green.
- **A chapter**: copy `c01.ts`, set `id`/`index`/`unlocks`/`stages`, register it
  in `src/content/chapters/index.ts`. Then lint it.
- **A command**: add it to `src/content/commands.ts` (id, keys, bilingual name
  and description, chapter) and to the relevant chapter's `unlocks` array.
  If the engine does not support it, implement it in `src/core/vim/` and add
  oracle cases in `tools/cases.ts`.

## Design laws

1. One insight per stage. The puzzle must make the command *necessary*.
2. `par` is the lesson: 3 stars = the elegant solution.
3. Show, don't tell. Briefs are 1–3 sentences of story.
4. No dead ends: `u` must always rescue the player.
5. Hazards teach precision (`t` vs `f`), never luck.
6. Buffers ≤ 56 columns, ≤ 14 rows, ASCII only, no trailing whitespace.
7. English is the game's voice; Korean is a translation (`Localized.ko`).
8. **The ten books are the syllabus.** Curriculum order and content must be
   traceable to `books-text/` (see `docs/CURRICULUM_PROVENANCE.md`); do not
   substitute an AI-invented lesson for book analysis.
9. **Mastery is embodied.** Introduce → drill → transfer → spaced review.
   Deliberate, sometimes boring repetition is a feature; a command seen once is
   not mastered. Repetition must be **varied** (text, cursor position, count,
   operator, nest, medium), never the same sentence over and over.

## Performance budget

The game targets a cheap phone with a Bluetooth keyboard.

- Zero runtime dependencies. Stretch goal: 200 kB raw / 70 kB gzip. **Hard
  ceiling enforced by `npm run budget`: 270,000 B raw / 86,000 B gzip** (current
  269.2 kB / 84.6 kB); do not raise it without a deliberate, measured reason.
- The renderer bakes one **opaque composite frame** (background, highlights,
  glyphs, bloom) and blits it once per frame; cursor, cursorline, line numbers,
  ghost and particles are the FX pass. Rebuild the frame only when its key changes.
- No `shadowBlur` in the render loop, no per-frame allocations in hot paths.
- Everything is keyboard-driven; the DOM is rebuilt per screen, not per frame.

## Gotchas

- Keys are strings with special tokens: `'<Esc>'`, `'<CR>'`, `'<C-w>'`.
  Use `tokenize()` from `src/core/vim/keys.ts`.
- Gating is **first-key** based (`Session.keyAllowed`). Keys typed inside
  insert mode are never gated.
- **The command echo renders only while `vim.awaitingKey` is true.** Failed
  commands must clear `count`/`cmdKeys` before returning; otherwise `u` at the
  oldest change leaves a phantom pending `u` on screen.
- `@` in level text marks the start and is replaced by `startChar` (default
  space) so grids never shift.
- `~` is hazardous by default; a stage with decorative `~` must set `hazard: ''`.

## Voice & look (do not drift)

VIMLORE is a **CRT terminal from a machine that should be dead**.

- Phosphor green on near-black, scanlines, bloom, a slow beam sweep. Not a
  black void: the tube glows.
- **English is the game's language.** Vim is a code editor; the fiction is a
  corrupted machine, logs, source, config. Korean exists as a translation
  (`Localized.ko`) but the English must read like a terse hacker terminal, not
  like a fantasy novel.
- Briefs are 1–3 sentences. Technical nouns beat adjectives.
- Every expensive effect (bloom, scanlines, flicker, screen shake) must obey
  the `crt` setting. `body.crt-off` disables all of them; the game must still
  look intentional with the tube off.
- Content should prefer *code* over prose: function calls, logs, JSON, config,
  hex dumps, HTML. A puzzle about repairing a build is better than a puzzle
  about repairing a poem.

## Renderer notes

`src/ui/render.ts` keeps a cached glyph layer and a single opaque composite
frame: background, selection/search highlights, glyphs and bloom are baked
together, then blitted once per frame. **Cursorline, line numbers and the
cursor are drawn on the FX pass** so vertical motion does not force a glyph
repaint. The frame key is `version|hue|coins|selection|matches|scroll` — if you
add a pixel that depends on something else, add it to the key or draw it on the
FX pass. Bloom is baked, never a per-frame additive blit. If you add an effect,
measure it on a 2019 phone: the budget is one 60fps frame at 390×844. Never
introduce per-frame allocation in `render()`.

## Coverage and known gaps

The authoritative matrix of what the engine does and does not do is
[`docs/VIM_COVERAGE.md`](docs/VIM_COVERAGE.md). The oracle is **373/373**
against a real vim (jumplist, `(`/`)`, `<C-a>`/`<C-x>` with octal/hex, insert
`<C-r>`/`<C-o>`). Not in the current single-buffer slice: multi-buffer/files/
windows/tabs (deferred, not rejected: `FUTURE_EDITOR.md`), folds, completion, `:!`,
quickfix/LSP, Vimscript/Lua, and viewport motions (`zz`, `zt`, exact `H/M/L`). `gn` / `g*` / `g#`, `\zs`/`\ze` and interactive `:s///c` are
implemented; simple brace-depth `=`/`gg=G` is also implemented. Next Tier 2:
`g;`/`g,`.

**Engine-completeness program:** the surface manifest, the normalization/
cursor extraction and the matrix/compose-fuzz gates are defined in
[`docs/ENGINE_PROGRAM.md`](docs/ENGINE_PROGRAM.md); read it before adding an
engine feature or a quirk patch.

**Buffers, files, splits and tabs are deliberately deferred, not rejected.**
The engine is single-buffer today. The target model, phases, invariants and
tests are in [`docs/FUTURE_EDITOR.md`](docs/FUTURE_EDITOR.md); never fake
`:b`/`:sp` by mutating `Vim.buf`, and do not start that program before Tier 2
plus the cursor-only fuzz backlog are green.

## Shipping

Target remote: `github.com/JungDonghee/vimlore`, branch `main`.

A fine-grained GitHub PAT is stored **outside this repository** at
`/home/jung/ai_station/sandbox/.secrets/github_token` (mode 600, notes in the
same directory). It can read the account, create repositories and push — but it
**cannot manage Pages**; the `pages` workflow enables Pages itself via
`actions/configure-pages` with `enablement: true`. Never copy the token into the
repo, never commit it, and scrub the remote URL after pushing:

```bash
TOKEN=$(cat /home/jung/ai_station/sandbox/.secrets/github_token)
git remote set-url origin "https://x-access-token:$TOKEN@github.com/JungDonghee/vimlore.git"
git push -u origin main
git remote set-url origin https://github.com/JungDonghee/vimlore.git
```

This is an **AI-purpose account**: token rotation is NOT required. But the token
must never leak to a third party — never print it into a prompt/log/commit, never
paste it into a chat/issue/PR, and always scrub the remote URL after pushing.
`.secrets/README.md` holds the full rules.

## TRIALS (endless / weakness / daily)

`src/core/game/trials.ts` generates chambers from twelve skill generators
(delete-word, delete-line, change-inner, change-quotes, capture-case,
indent-block, fix-typo, dot-repeat, duplicate-line, join-lines, substitute,
increment). **Every
candidate is verified by simulation** (`verify()` runs the intended keystrokes
through a real `Session`) and is rejected unless it wins on its last key — so a
generated level can never be unbeatable. Preserve that invariant when you add a
generator:

1. build `{ text, goalText, keys }` deterministically from the seeded `rng`;
2. add it to `SKILLS` with `tier` and the `keys` it trains;
3. run `npm test` — `tests/trials.test.ts` proves every generator ships.

Telemetry lives in `progress.stats` (per skill: attempts / clears / restarts /
keys / par). `weakestSkills()` ranks them with
`weaknessScore = (1-clearRate) + 0.8·max(0, keys/par−1) + 0.6·restartRate`.
The WEAKNESS mode feeds those ids back into `generateTrial(seed, undefined, weak)`.

Identity is login-free: `progress.profile{name, since}` plus an export code
(`encodeSave`/`decodeSave`, base64 JSON) in Settings. There is no server and
there must not be one — the game is static hosting only.

## Play screen internals (v1.5)

The chamber is rendered as a **Vim window**: `tabline` (buffer path) → canvas
buffer (top-left text, line-number gutter, `~` to the statusline, cursorline) →
`statusline` (mode · line,col · par · hearts) → objective/command bar.

Three rules keep it correct:

1. The **composite frame** is rebuilt only when its key changes (buffer
   version, hue, coins, selection, matches, scroll). Cursorline, line numbers
   and the cursor are drawn on the FX pass; the command line (`:`/`/`) replaces
   the buffer cursor with a DOM cursor. Briefing overlays sit above the CRT
   scanlines (`z-index: 70`) so text stays crisp.
2. **The view follows the cursor, Vim-style.** Lines never wrap: a long insert
   scrolls horizontally, and more lines than fit scroll vertically
   (`ensureCursor` + `scrollX/scrollY` in `render.ts`). The frame key includes
   the scroll origin; only visible lines/columns are painted.
3. Key auto-repeat is implemented by the game, not the OS (`startRepeat` in
   `PlayScreen`): 320 ms delay, 50 ms cadence, OS `repeat` events swallowed,
   stopped on keyup / blur / visibilitychange / win / restart. Repeats are
   silent and never start for a key the session rejected.

## Input & UI rules (v1.6)

- **F1 opens the 60-second primer on every screen** (title, map, codex, progress,
  trials, settings, play, results); Esc/Enter closes it and focus returns to the
  control you had. The primer scrolls with j/k/PageUp/PageDown.
- The play screen has a **coach** that appears without being asked after ~6–10 s
  idle (first hint), then escalates. Locked keys and damage also raise it. Any
  key dismisses it; Tab still gives the next hint; F3 still shows the ghost.
- The game must be **fully playable with a keyboard only**. Every list screen
  scrolls with `j`/`k`, `Ctrl-d`/`Ctrl-u`, `PageUp`/`PageDown`, `g`/`G`,
  `Home`/`End`; the map moves its selection with the same keys. Mouse and touch
  are a convenience, never a requirement.
- Any "press any key" screen also advances on `pointerdown` (touch/click).
- The space bar arrives as the token `<Space>`; `insertKey` and `cmdlineKey`
  must map it to `' '` explicitly — a `key.length === 1` check alone silently
  drops it.
- **Tab is the hint key outside insert/replace.** In insert/replace it must
  reach the engine, which expands it to spaces to the next tabstop (4); never
  intercept it globally.
- **The gutter defaults to Vim relative numbers (`rel`)**: the cursor line
  shows its absolute number, every other line shows its distance from the
  cursor (so `5j` reads as the line labelled 5). Settings toggles `rel` ↔
  `abs`; new saves are version 2 and a v1 `abs` default migrates to `rel`.
  `:set number / relativenumber / nonumber / nornu` still overrides the current
  chamber. Numbers are drawn on the FX pass because they depend on the cursor
  line; the glyph layer itself must stay cursor-free.
- Focused buttons are scrolled into view (`focusIndex`), so a long settings or
  results card never traps the keyboard user off-screen.
- **Esc is Vim's Esc, never an exit shortcut.** It cancels insert/visual/
  operator-pending and otherwise does nothing. Leaving mid-play goes through
  the F10/× LEAVE prompt (CANCEL is focused by default; LEAVE confirms); Esc
  closes that prompt without leaving.
- **Ghost playback starts from the stage's initial text, never the edited
  buffer, and restores the live session verbatim afterwards.** F3 builds a
  fresh demo Session (no key count, hazards, pickups or `won`), plays the
  solution there, then puts the untouched live Session back — buffer, cursor,
  undo, registers, keys and mode. Do not `restart()` after a ghost; the next
  overlay must never appear and Enter stays ignored while ghosting.
- **F9 / the tabline ‹ and results PREV** go to the previous chamber when one
  exists. The map resumes at the first uncleared stage, so an explicit PREV is
  the way back to a cleared stage.
- Results shows a **DRILL** cue: repeat the par solution or RETRY to close the
  keys-to-par gap. Repetition is deliberate; never remove it for novelty.
- Settings name/export/import use an **in-game keyboard prompt** (input focused,
  Enter submits, Esc cancels, readonly export with Ctrl+A/Ctrl+C); erase uses an
  in-game YES/CANCEL confirm (h/l, Enter, Esc). No browser dialogs for these.
