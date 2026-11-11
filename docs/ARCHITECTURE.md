# ARCHITECTURE

VIMLORE is a single static web page with **zero runtime dependencies**. It ships
as one self-contained `dist/vimlore.html` and runs entirely in the browser:
there is no server, no account, no database, and no third-party request. The
only thing that looks like a backend is `tools/oracle-diff.ts`, a development
harness that runs against a real `vim -u NONE` binary to keep the in-game engine
honest.

## Layers

```
src/content/   the game as data: chapters, stages, the command Grimoire
src/core/game/ the game as rules: session, goals, skills, progress, trials
src/core/vim/  the emulator: a faithful subset of Vim
src/ui/        the shell: canvas CRT renderer, screens, WebAudio sfx
tools/         development harnesses (no runtime footprint)
docs/          authoring + coverage + this file
tests/         unit tests (engine fidelity, trials) — no browser needed
```

Dependencies point **downward only**: `ui` → `game`/`vim`, `game` → `vim`,
`content` → `game` types. `core/vim` is pure and knows nothing about the game;
you can run it headless (the tests do).

## Bug-resistant rings

Correctness is layered so a single plausible mistake cannot reach production
unnoticed. Each ring must pass before the next is trusted:

1. **Real-Vim oracle** (`tools/oracle-diff.ts`, 352 cases): every engine
   behavior that can be automated is diffed against `vim -u NONE`.
2. **Strict post-key invariants** (`Vim({ strict: true })`): after every single
   key, `Vim.assertInvariants()` checks mode, cursor bounds, visual anchor,
   pending count, confirm matches and jump index. The oracle and fuzzer run with
   strict mode on; an impossible state throws immediately instead of surfacing
   later as a weird cursor.
3. **Seeded differential fuzzing** (`tools/fuzz.ts`): random ASCII buffers ×
   random key sequences, sentinel-based Vim-error detection. The six regression
   seeds are content-clean; the remaining cursor-only edges are documented, not
   hidden.
4. **Level simulation** (`npm run lint:levels`): every one of the 51 stages is
   replayed through the real `Session` with its chapter gate; it must win on the
   last keystroke in exactly `par`.
5. **Cross-layer invariants** (`npm run invariants`): the Grimoire, chapter
   unlocks, stage `teaches`, duplicate ids, par/solution and bilingual metadata
   are checked as one graph; coverage gaps are warnings, inconsistencies are
   errors.
6. **Docs/build/CI**: `tsc`, `doc-check`, `npm run build`, CI upload and the
   Pages asset-hash check. No absolute asset paths, no secrets, no server.
7. **Prompt/handoff contract**: [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md) standardizes
   the task packet, evidence, definition of done and handoff schema so the next
   AI cannot mistake prose for proof.

A red ring stops the line. Fix or revert; never commit a “mostly green” state.

## core/vim — the engine

The heart of the project. A faithful re-implementation of the Vim commands the
curriculum needs, diff-tested against real Vim (`tools/oracle-diff.ts`,
**352/352**).

| file | responsibility |
|---|---|
| `types.ts` | `Pos`, `Mode`, `MotionResult`, register/buffer snapshots |
| `buffer.ts` | `Buffer` — the line array, cursor, edits, undo snapshots |
| `keys.ts` | `tokenize()` and special-key tokens (`<Esc>`, `<C-w>`, …) |
| `motions.ts` | `h j k l w e b f t % ( ) { }` … pure functions over `MotionEnv` |
| `objects.ts` | text objects (`iw aw i" a" i( a( ip ap …`) |
| `search.ts` | regex compile/match/`pickMatch` for `/ ? n N * #` |
| `ex.ts` | `executeEx()` — `:s :g :v :d :m :t :sort :normal :set` |
| `wordindex.ts` | word-class tokens shared by word motions and objects |
| `engine.ts` | `Vim` — the mode/operator state machine that binds it all |

`Vim.feedString(keys)` is the single entry point; it mutates the `Buffer` and
emits `VimEvent`s. Levels and TRIALS both drive the same engine, so a generated
chamber and an authored stage are impossible to tell apart mechanically.

## core/game — the rules

| file | responsibility |
|---|---|
| `types.ts` | `Stage`, `Chapter`, `Goal`, `Progress` (the save shape) |
| `session.ts` | `Session` — key gating, hearts, coins, stars, restarts |
| `goals.ts` | `checkGoal()` — did the buffer reach the goal? |
| `skills.ts` | skill model, contribution grass, streaks |
| `stats.ts` | per-skill telemetry, weakness ranking, save encode/decode |
| `trials.ts` | 12 seeded skill generators; every candidate is `verify()`-simulated |

## content — the game as data

- `commands.ts` — the Grimoire: bilingual (en/ko) command cards, one per
  teaching insight, keyed by chapter.
- `chapters/cNN.ts` — ten floors, 51 stages. Each stage is a `{ text, goal,
  par, brief, solution, hazards }` object.
- `chapters/index.ts` — `CHAPTERS` in unlock order.

Authoring is governed by `docs/LEVEL_FORMAT.md` and enforced by
`tools/level-lint.ts` (`npm run lint:levels`), which replays each stage's
`solution` and asserts it wins on the last keystroke in exactly `par` keys.

## ui — the shell

| file | responsibility |
|---|---|
| `app.ts` | screens, progression, settings, save import/export |
| `play.ts` | `PlayScreen` — the chamber loop, key handling, auto-repeat |
| `render.ts` | `Renderer` — cached glyph layer + per-frame FX (cursor, cursorline) |
| `sfx.ts` | `Sfx` — WebAudio synthesizer (no samples) |
| `dom.ts` | tiny DOM helpers |

The renderer keeps a cached glyph layer and repaints it only when the buffer,
hue or coins change; every frame composites one `drawImage` plus cursor and
particles (see AGENTS.md, "Renderer notes").

## tools — development harnesses

| file | purpose |
|---|---|
| `oracle-diff.ts` | run `CASES` through real Vim vs the engine, require identical buffer+cursor |
| `cases.ts` | the shared differential corpus (the single source of truth for the count) |
| `level-lint.ts` | replay every stage solution, assert par and gating |
| `doctor.ts` | one-command environment check for a brand-new agent |
| `doc-check.ts` | CI-safe gate: doc numbers/links must match the code |
| `gen-docs.ts` | regenerate `docs/LEVELS.md` |
| `inline.mjs` | fold the Vite build into the single `dist/vimlore.html` |
| `extract_books.py` | pull text from the source books into `books-text/` (not committed) |

## Build & deploy

```
npm run build        # vite build + tools/inline.mjs → dist/ + dist/vimlore.html
npm test             # engine + goals + trials (headless, no browser)
npm run lint:levels  # all 51 stages green
npm run doc-check    # doc numbers/links match the code
```

CI (`.github/workflows/ci.yml`) runs `tsc`, tests, `lint:levels`, `doc-check`
and the build, then asserts no absolute asset paths. Pages
(`.github/workflows/pages.yml`) builds `dist/` and deploys it to GitHub Pages.
The single-file `dist/vimlore.html` is also committed-adjacent build output
(see `.gitignore`: `dist/` is ignored, Pages builds it fresh).

## Invariants

1. The engine must keep matching real Vim (`oracle-diff.ts`).
2. Every stage must pass `lint:levels`.
3. No server, no secrets in the repo, no runtime dependencies.
4. Docs never drift from the code (`doc-check.ts`).
