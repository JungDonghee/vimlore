# ENGINE PROGRAM — closed-world completeness

> **Status: Phase A live (2026-11-11).** This document defines what "the
> engine is perfect" means for VIMLORE, how the engine is layered, and the
> gates that make the claim checkable. It supersedes "add more oracle cases
> until it feels done" as the engine roadmap.
>
> Read with [`MASTER_PLAN.md`](MASTER_PLAN.md), [`VIM_COVERAGE.md`](VIM_COVERAGE.md),
> [`HANDOFF.md`](HANDOFF.md) and [`FUTURE_EDITOR.md`](FUTURE_EDITOR.md).

## 0. Why this program exists

VIMLORE does **not** need to run Vim or Neovim. It needs to be **complete and
provably correct inside the surface it teaches**, and **explicitly closed
outside it**. That is a different, smaller and harder-to-cheat goal than "be
Vim".

The current engine is strong at the grammar and weak at the boundary:

| layer | current state |
|---|---|
| command grammar (count → register → operator → motion/object → mode) | present, compositional |
| effects (buffer, undo, registers, marks, jumps, insert) | present |
| **range normalization** (what a motion+operator actually selects) | scattered across `finishOpWithMotion`, `applyOp`, `deleteRange`, `caseRange`, `shiftRange` |
| **cursor policy** (where the cursor lands after an operation) | scattered, one branch per quirk |
| **surface manifest** (what is in scope, with evidence) | prose only (`VIM_COVERAGE.md`, fuzz alphabet) |
| **systematic matrix coverage** | missing; fuzz is random |
| **explicit refusal outside scope** | missing; unsupported input can half-work |
| oracle / fuzz / invariants | strong (363 cases; 12 of 12 fuzz seeds clean at n=1000) |

The last engine pass proved the point: `de`/`2dw` linewise conversion,
counted `$`, zero-range `^`/`h`, bracket linewise objects and visual-block
short lines were each a **range/cursor rule**, but each landed as a separate
patch in a different function. They are the "essence" of Vim editing, and they
deserve one home.

## 1. Definitions

- **Surface**: every key, command, motion, text object, ex command and mode the
  game can encounter — levels, TRIALS, the Grimoire, gating, hazards, save.
- **In scope**: taught features (a stage or grimoire entry teaches them) plus
  engine-only features used by TRIALS/tests plus infrastructure (undo, registers,
  marks, jumps, gating, search state).
- **Deferred, not out of scope**: features that are on the product backlog but
  deliberately not in today's surface — buffers/files/windows/tabs
  (`FUTURE_EDITOR.md`), folds, completion, `:!`, quickfix/LSP, Vimscript/Lua,
  viewport motions. They are not rejected; their phases start only after the
  current fidelity stage, and until then the engine refuses them
  deterministically instead of half-editing.
- **Never (product boundary)**: embedding a real Vim/Neovim runtime, a server,
  or runtime dependencies. The game stays static and the engine is ours.
- **Out of scope today**: any input not in the current surface. A deferred
  feature enters the surface only when its phase starts and it ships with
  oracle proof.
- **Closed world**: for every current-surface input the result must match real
  Vim; for every non-surface input the engine must produce a deterministic
  refusal (bell + a capability event), never a silent half-edit.
- **Proof obligation**: the evidence a feature must ship with — oracle cases,
  matrix coverage, fuzz alphabet membership, invariants, a docs row, and a game
  usage tag.

## 2. Architecture — five layers, one normalization

```
grammar     count · register · operator/command · motion/object/prefix · mode
geometry    Pos · SelRange · inclusive/exclusive · linewise · virtual column
normalize   (op, motion, from, to, mode, ctx) -> effective range
cursor      (op, range, ctx) -> cursor position
effects     buffer / undo / registers / marks / jumps / insert
```

The first, second and fifth layers already exist. This program extracts the
third and fourth into `src/core/vim/normalize.ts` and `src/core/vim/cursor.ts`,
then rewrites the existing call sites to use them. **This is an extraction, not
a rewrite.** The oracle stays green at every commit.

### 2.1 The quirk registry

Vim is a language plus thirty years of compatibility decisions. The quirks are
part of the semantics, so they are named, documented and oracle-linked instead
of living as anonymous `if`s. Known families (IDs are stable):

| id | rule | evidence |
|---|---|---|
| Q01 | `cw` behaves like `ce`; counts extend through words | oracle `cw on comma`, `2cw` |
| Q02 | a charwise `d` spanning lines to EOL from the indent is linewise (`2dw`, `de`); `c`/`y` stay charwise | pass-2 cases |
| Q03 | counted `$` is charwise; only `d` converts | `3c$`, `3y$` |
| Q04 | zero-range `0`/`^`/`h` at column 0 of a non-first line is linewise; line 1 toggles one character (`cursor.ts`) | `g~0`, `g~^`, `g~h` |
| Q05 | multi-line bracket objects are linewise when the brackets own their lines; empty pairs park on the closer | `di{`, `ci(`, `f()` |
| Q06 | visual-block geometry shrinks on short lines for `<` | block cases |
| Q07 | backward `(` uses real sentence starts (BOF, blank-run tail, paragraph, punctuation+space) | sentence cases |
| Q08 | counted `iw` counts a space run as a unit and skips line breaks; `iW` across lines is linewise | `2diw`, `3ciW` |
| Q09 | case-operator cursor: backward motion keeps its landing column; single-line uses min(col, fnb); text-object yanks start at column 0 (`cursor.ts`) | pass-1/2 cases |
| Q10 | backward column-0 ranges (`cB`/`dB`/`yB` from an empty line) are linewise on the lines above | `cB`, `dB` |
| Q11 | `ap` at the last paragraph takes the preceding blank; counted `ap` crosses separators | `2cip`, `2dap` |

A new quirk is a new row plus oracle cases, never a new branch in an operator.
`normalize.ts`/`cursor.ts` are allowed to grow only through this table.

## 3. The surface manifest

the generated human surface view [`ENGINE_SURFACE.md`](ENGINE_SURFACE.md) and a
machine manifest (`src/core/vim/surface.ts` or `docs/surface.json`) describe
every entry:

```ts
type Scope = 'taught' | 'engine-only' | 'infrastructure' | 'out';

interface SurfaceEntry {
  id: string;              // 'operator.d', 'motion.w', 'object.iw', 'ex.s'
  keys: string[];
  scope: Scope;
  modes: Mode[];
  oracle: string[];        // case names in tools/cases.ts
  matrix?: string[];       // generated matrix groups
  game?: string[];         // stage ids / TRIALS skill ids
  docs?: string;           // VIM_COVERAGE.md row
  refusal?: string;        // required for scope: 'out'
}
```

`tools/surface-audit.ts` derives the initial manifest from `commands.ts`,
`CHAPTERS`, `tools/cases.ts`, `trials.ts` and the fuzz alphabet, then reports:

- taught entries with no oracle case (gap),
- entries with no mode coverage (operator only tested in normal mode),
- oracle cases that map to no entry (orphans),
- engine behaviour with no entry (accidental support),
- out-of-scope keys that currently do something (silent half-support).

The audit is a **CI gate**. Prose coverage stops being the source of truth.
**Phase A is live.** `npm run surface -- --strict` runs in CI. Current numbers:

- 86 of 86 Grimoire commands have engine evidence (78 oracle-touched + 8 unit-only:
  `q`, `@`, `:g`, `'`, `:d`, `:sort`, `:normal`, `gq` — ex/macro/mark/format
  commands the `normal!` oracle harness cannot drive);
- 9 engine-only features without a Grimoire row (`^`, `gg`, `G`, `(`, `)`,
  `<C-a>`, `<C-x>`, `g#`, `=`) each have oracle cases;
- 0 orphan oracle cases: every one of the 363 cases maps to a command or an
  engine-only feature;
- 15 grimoire-only commands and 12 commands no stage solution uses remain
  **curriculum** gaps, reported separately, not engine gaps.


## 4. Gates — what "perfect" means, numerically

| gate | rule |
|---|---|
| **surface** | 100% of in-scope entries have a pointer to oracle cases (≥1 per mode), a matrix group, and a docs row; 0 orphans; 0 accidental features |
| **matrix** | for the taught surface, generate motion/object × operator × mode × count and boundary conditions, diff against real Vim; **0 divergences**; coverage % ratchets up, never down |
| **compose-fuzz** | generate valid command trees from the manifest (not random ASCII keys) and diff; failures shrink to a readable command |
| **fuzz** | alphabet derived from the manifest; 12 seeds × n=1000 = 0 divergences |
| **invariants** | strict post-key state; no out-of-scope mutation; refusal is side-effect free |
| **oracle** | only grows; every case mapped; snapshot emitted |
| **CI** | native vim oracle + surface audit are live (`.github/workflows/ci.yml`); matrix/compose-fuzz still local-only |
| **performance** | key handling p99 budget; frame budget unchanged (engine < 1 ms/key on desktop) |

"Perfect within the covered set" is exactly: **surface 100%, matrix 0
divergences, compose-fuzz 0, fuzz 0, 0 silent half-support.** Out-of-scope is
allowed to be absent; it is not allowed to be mysterious.

## 5. Phases

### Phase A — manifest and audit (done, first cut)
Built `tools/surface-audit.ts` + generated [`ENGINE_SURFACE.md`](ENGINE_SURFACE.md);
`--strict` is a CI gate. Evidence went from 86/91 to **86 of 86 commands**, with 9
engine-only features and 0 orphan cases. Out-of-scope refusal (Phase D) is the
remaining half of the closed-world contract.

### Phase B — essence extraction (normalize + cursor done)
`normalize.ts` owns `flatRange` and Q02/Q10; `cursor.ts` owns the Q04/Q09 cursor
policy (zero-range case motions and the linewise case-operator landing). The
engine keeps only effect dispatch and calls both modules; oracle 363/363 and
matrix 21,712/21,712 stayed green through the extraction. Remaining: Q03/Q06
(case/yank cursor details) if they earn a separate home. Acceptance is
unchanged: oracle green at every commit, every branch linked to a quirk ID.

### Phase C — matrix and compose-fuzz (matrix done, CI gate)
`tools/matrix.ts` generates **21,712** valid command trees (8 texts, 2-3 cursor
positions, 20 motions, 20 objects, 8 operators, counts {none, 2}, normal +
visual/visual-line/visual-block + doubled) and diffs them with
`feedkeys('xt')` — user-observable final state, not `normal!` abort state.
Current run: **21,712 matched / 0 divergences**. The last families closed were
`b`/`B` backward ranges across lines (linewise at the first non-blank, charwise
otherwise), `d)` linewise ends, blank-line `w`/`W`/`$` conversion, and
visual-block `<` after a `G` motion. The matrix now runs in the CI `oracle` job,
so a grammar regression fails the build. `tools/compose-fuzz.ts` (random
command trees) is the remaining Phase C work.
Matrix is a CI gate (oracle job) now that it reaches 0.
`tools/compose-fuzz.ts` (random command trees) is still to come.

### Phase D — closed world
`Vim.supports(key)` / capability events; out-of-scope input refuses
deterministically; the game shows a clear message instead of a half-edit.
Acceptance: no silent out-of-scope mutation; refusal covered by tests.

### Phase E — performance and handoff
Measure key→render latency and allocations; optimize only what the profile
shows. Update `HANDOFF.md`, `MASTER_PLAN.md`, `AGENTS.md` and this file.

## 6. Non-goals

- No real Vim/Neovim runtime. (See "why" below.)
- No new stages or chapters in this program.
- No buffers/files/windows/tabs/folds/completion/terminal/scripting.
- No big-bang rewrite of `engine.ts`.
- No silent bundle-gate raise.
- No "teach everything Vim does" — only the surface, perfectly.

## 7. Why not embed real Vim/Neovim

It is now technically possible (Neovim's wasm/emscripten browser demo merged in
2026; `nvim-wasm` runs the real process in a worker), but for this product it
trades the wrong things:

- 7.8–8.4 MB wasm vs a 260 kB single file; startup and memory on the target
  phone; COOP/COEP on GitHub Pages or Asyncify overhead.
- Neovim is driven as a **process over msgpack-RPC**, not called as a library;
  the game's key gating, coins, hazards and par counting would straddle that
  boundary (macros and `:normal` replay inside Neovim and bypass a front-end
  gate).
- Level lint, TRIALS verification, deterministic replay and the native-Vim
  oracle would need a second harness on top.
- The engine is not the frame-time bottleneck; replacing it does not make the
  game smoother.

Real Neovim belongs in an optional free-play mode or a development oracle, not
in the campaign engine. This program is how the campaign engine earns the word
"complete" without it.

## 8. First three tasks

1. ~~`tools/surface-audit.ts` + report~~ — done, strict CI gate.
2. ~~CI native-Vim oracle job~~ — done (`oracle` job: 363 cases + fuzz smoke).
3. ~~Phase B pilot: delete normalization (Q02/Q10) into `normalize.ts`~~ — done;
   next is the cursor policy (Q04/Q09) and Q03/Q06 in the same module.
4. **Phase C next:** close the 263 matrix divergences by family (counted
   `iw`/`aw`, `,`, `)` edges, quote objects), one rule at a time, with a matrix
   case turning into an oracle case for each fix. Then extend the matrix
   comparison from buffer+cursor to registers/mode/undo — still
   user-observable state.

## 9. One sentence

**Define the surface, make every rule in it named and oracle-linked, prove the
composition systematically, refuse the rest explicitly — that is what "the
engine is the product" means.**
