# LEVEL FORMAT — the authoring bible

Everything in VIMLORE is data. A chapter is one TypeScript file that exports a
`Chapter` object. No engine or UI changes are ever needed to add content.

- File: `src/content/chapters/cNN.ts`, export `cNN`, then register it in
  `src/content/chapters/index.ts` (only when adding a *new* chapter).
- Type: `src/core/game/types.ts`
- Examples to copy from: `c01.ts` (movement + editing), `c02.ts` (coins,
  precision, hazards).
- Verify with: `npm run lint:levels -- 3` (chapter number).

## The shape of a stage

```ts
{
  id: 'c03s2',                 // must start with the chapter id
  name: { en: 'Pruning', ko: '가지치기' },
  brief: { en: '...', ko: '...' },
  text: `...`,                 // the initial buffer
  startChar: '.',              // optional: what `@` leaves behind (default space)
  goal: { type: 'exact', text: `...` },
  par: 7,
  solution: 'dw..',            // the intended keys; also the ghost replay
  teaches: ['dw', '.'],        // ids from src/content/commands.ts
  hints: [{ en: '...', ko: '...' }, { en: '...', ko: '...' }],
  hazard: '~',                 // optional, default '~'; '' disables
  hearts: 3,                   // optional
  whisper: { en: '...', ko: '...' },
}
```

### `text` conventions

| char | meaning |
|------|---------|
| `@`  | player start. Replaced by `startChar` (default: space) so the grid never shifts. Exactly one per stage. |
| `*`  | goal marker, used with `{ type: 'reach', char: '*' }` |
| `~`  | static / hazard (damage on landing, unless `hazard: ''`) |
| `$`  | coin, used with `{ type: 'collect', char: '$' }` |
| `#` `+` `-` `\|` | decoration only — no collision, the cursor may stand on it |

Use ASCII only in buffers. The renderer draws `*`, `~`, `$` as glowing glyphs,
so do not use them as ordinary punctuation in puzzle text.

### Goals

```ts
{ type: 'reach', char: '*' }                     // cursor lands on a char
{ type: 'exact', text: `...` }                   // whole buffer (trailing ws ignored)
{ type: 'lines', from: 2, lines: ['a', 'b'] }    // 1-based line slice
{ type: 'none', chars: '~' }                     // no occurrence left
{ type: 'collect', char: '$' }                   // land on every one
{ type: 'cursor', line: 3, col: 0 }              // 0-based
{ type: 'all', of: [ … ] }                       // every sub-goal must hold
```

## par and solution are a contract

`solution` is the intended keystroke sequence, written like a player types it:
`ci"fixed<Esc>`, `3dd`, `:%s/a/b/g<CR>`, `qafoo<Esc>jq@a`.

- `par` **must** equal `tokenize(solution).length`.
- The stage must be won **on the last key**, not earlier.
- The solution must not use keys the chapter has not unlocked.
- The solution is also the in-game "ghost" — it should look elegant, not clever.

The linter enforces all of this. If it says *wins early*, shorten the solution.
If it says *par != length*, fix `par`.

### Unlocks

`Chapter.unlocks` lists **first keys** the chapter grants. Gating is
first-key based (pressing `d` in chapter 2 says "LOCKED"), so:

- every key used at the start of a command in a solution must be in the
  cumulative unlock list of chapters 1..N;
- keys typed *inside* insert mode are never gated;
- `h j k l <Esc> u <C-r>` and digits are always allowed.

Add keys to `unlocks` generously — players should never be blocked from a
command the stage is about. Prefer adding a key one chapter early over
frustrating a player.

## Design rules (read these twice)

1. **One insight per stage.** The player should end a stage knowing exactly one
   new thing, even if the stage is long. A stage may *recombine* old skills.
2. **Show, don't tell.** The brief is 1–3 sentences of story. Never write a
   manual paragraph. The puzzle itself must make the command feel necessary.
3. **par is the lesson.** If `w` is introduced, the level must be tedious with
   `l` and elegant with `w`. That gap *is* the teaching.
4. **No dead ends.** Never require deleting the goal or an unrecoverable edit;
   `u` must always be able to rescue the player.
5. **Hazards teach precision, not punishment.** A hazard must be avoidable by a
   better command (`t` instead of `f`, `w` instead of `llll`), never a coin
   flip. Max 3 hearts, max 1 hazard lesson per stage.
6. **Every stage must be replayable for 3 stars.** par is tight; 2 stars is
   par×1.4; the first clear should usually be 1–2 stars.
7. **Names and briefs are bilingual.** Korean must read naturally, not like a
   translation. Short sentences. The voice is warm, slightly mysterious.
8. **Keep buffers ≤ 56 columns and ≤ 14 rows.** Narrower is better for phones.
9. **No trailing whitespace in `text`.** It is invisible and easy to break.
10. **A chapter is a story beat.** Its 5 stages escalate: introduce → practise
    → combine → twist → boss (boss recombines the whole chapter).

## Checklist before you say you are done

```bash
npm run lint:levels -- 3     # every stage must print "ok"
npx tsc --noEmit             # no type errors
```

Then read your own `brief`s and delete half the words.
