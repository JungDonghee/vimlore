# AGENTS.md — read this first

VIMLORE is a **Vim teaching game**. The player is a cursor inside a text
buffer and plays with *real Vim keys*. It must feel like a game, not a course.

This file is the map for any AI (or human) continuing the project.

## The one invariant

**The engine must behave like real Vim.** Every command a level uses is
executed by `src/core/vim/engine.ts`, and that engine is diff-tested against a
real `vim` binary (`tools/oracle-diff.ts`). If you change motions, operators or
text objects:

```bash
node --experimental-strip-types tools/oracle-diff.ts   # 102/102 must pass
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
node --experimental-strip-types tools/oracle-diff.ts   # vs real vim
```

`npm run lint:levels` is the safety net: it replays each stage's `solution`
through the engine, with that chapter's unlock gate, and asserts the stage is
won on the last keystroke in exactly `par` keys. **Never commit red levels.**

## Where things live

```
src/core/vim/       the emulator (buffer, motions, objects, ex, search, engine)
src/core/game/      session (hearts, keys, coins), goals, progress types
src/content/        commands.ts (the Grimoire) + chapters/cNN.ts (the game)
src/ui/             canvas renderer, screens, WebAudio sfx
tools/              level linter, vim oracle, single-file inliner
docs/               LEVEL_FORMAT.md (authoring), CURRICULUM.md (the 10 floors)
```

## Adding content

- **A stage**: edit `src/content/chapters/cNN.ts`. Read `docs/LEVEL_FORMAT.md`.
  Run `npm run lint:levels -- NN` until green.
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

## Performance budget

The game targets a cheap phone with a Bluetooth keyboard.

- Zero runtime dependencies. Total JS must stay under ~150 kB raw.
- The renderer caches the glyph layer and only repaints it when the buffer
  changes; each frame draws one `drawImage` + cursor + particles.
- No `shadowBlur` in the render loop, no per-frame allocations in hot paths.
- Everything is keyboard-driven; the DOM is rebuilt per screen, not per frame.

## Gotchas

- Keys are strings with special tokens: `'<Esc>'`, `'<CR>'`, `'<C-w>'`.
  Use `tokenize()` from `src/core/vim/keys.ts`.
- Gating is **first-key** based (`Session.keyAllowed`). Keys typed inside
  insert mode are never gated.
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

`src/ui/render.ts` keeps a cached glyph layer and composites it every frame:
one `drawImage`, four offset blits for bloom, then cursor/particles. If you add
an effect, measure it on a 2019 phone: the budget is one 60fps frame at
390×844. Never introduce per-frame allocation in `render()`.

## Known gaps (fix these next, carefully)

The engine is faithful for everything the levels use, but three motions are off:

1. `<C-i>` never advances — `jumpForward` requires `jumpIndex < jumps.length-1`
   while every push sets `jumpIndex` to the end.
2. `<C-o>` skips one entry (off by one, and it needs 2+ jumps to respond).
3. `(` (sentence back) scans for whitespace *before* the terminator and falls
   through to offset 0.

`c08s4` is built on the current `<C-o>` behaviour: if you fix the jumplist,
re-derive that stage and re-run `npm run lint:levels -- 8`. Also unimplemented:
`:s///c` confirmation, split windows/buffers (levels are single-buffer), and
`gq` uses the stage's `textwidth` rather than the editor option.
