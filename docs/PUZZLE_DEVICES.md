# Puzzle devices — one-shot floors, reactive paths, command locks

> Design contract for turn-based puzzle devices. This is the layer that makes
> VIMLORE a *game* rather than a sequence of edit prompts. It is deliberately
> separate from the real-time LIVE bugs.

## 1. Verdict

The device idea is strong and should be the **next gameplay layer after the
LIVE vertical slice**. It turns Vim commands into spatial consequences:

- step once → the floor vanishes forever in that run;
- edit the right region → a bridge appears;
- yank into a register → a door opens;
- sort lines → a sequence of plates aligns;
- search for the right word → a hidden path is revealed.

But it must be **turn-based, deterministic and simulation-verified**, not a
random action minigame. A puzzle can be lost by a bad route, but it must be
resettable and solvable by reasoning.

## 2. Core rule: game state is a meta-grid, not the Vim buffer

The Vim buffer stays honest text. Floors, walls, plates and bridges are
meta-cells rendered over it.

```
Vim buffer        real text, motions/operators semantics
Meta-grid         walkable | wall | void | plate | door | bridge | collapse
DeviceDirector    triggers and effects, evaluated after accepted keys
PuzzleState       deterministic, resettable, no random hazards
```

Consequences:

- an edit can delete a **word** but never delete an **immutable wall**;
- a wall is not a character, so `x`/`dw` cannot bypass it;
- a meta-cell transition does not change Vim's undo stack;
- reset (F2 / retry) resets the whole run, including one-shot devices;
- a campaign level remains one buffer and one deterministic route.

## 3. Device taxonomy (v1)

### 3.1 One-shot collapsing floor (`collapse`)
- First entry marks the cell **consumed**.
- It disappears when the cursor leaves it (never under the player).
- It cannot be entered again in that run.
- Reset restores it.
- Visual: dashed green tile that flickers once, then a hollow red void.

### 3.2 Pressure plate (`plate`)
- Entering/landing triggers exactly once (or toggles if configured).
- Can open a door, extend a bridge, spawn a coin/bug, or reveal a hint.
- Visual: hex/circuit node; pressed state persists.

### 3.3 Command/effect lock (`lock`)
- Trigger is **observable effect**, not a raw key script:
  - a quoted word changed but quotes intact;
  - a region became empty;
  - a line was yanked into register `a`;
  - lines became sorted;
  - a search pattern found MOTH;
  - N lines were changed by a macro/dot repeat.
- This survives macros, dot-repeat, `:normal`, counted operations and remaps.
- If an exact command is required for teaching, the UI may *display* it, but the
  validator should still assert the resulting state, not a keystroke string.
- Visual: bracket glyph with a key/verb shape; opens with a scanline.

### 3.4 Conditional barrier (`barrier`)
- Opens only when a predicate is true:
  - visited all plates in order;
  - register contains a line;
  - no `ROT` tokens remain;
  - count/line range condition;
  - cursor passed through a mark/jump.
- Re-closes only if configured; default is one-way open (avoid soft-lock).

### 3.5 Spawner / constructor (`spawn`)
- Creates bridge tiles, coins, a bug, a wall segment, a shortcut.
- Always has a **budget** (max cells/entities) and a **telegraph** animation.
- Cannot spawn on the cursor, on a coin, or inside a wall.

### 3.6 Sequence / state machine (`sequence`)
- Ordered plates, a lever network, or a small AND/OR/NOT circuit.
- Wrong order resets only that sequence (not the run) unless marked deadly.
- Visual: numbered glyphs, lit path; no hidden order without a readable clue.

### 3.7 Time/visit device (later, LIVE only)
- Real-time doors in LIVE CIRCUIT, never in the deterministic campaign.
- Telegraph and pause rules from the LIVE plan apply.

## 4. Trigger model

A device is data, not bespoke code:

```ts
type Trigger =
  | { kind: 'enter'; cells: Cell[]; once?: boolean }
  | { kind: 'effect'; id: string; args?: Record<string, unknown> }
  | { kind: 'predicate'; all?: Trigger[]; any?: Trigger[]; not?: Trigger[] }
  | { kind: 'sequence'; devices: string[]; ordered: boolean };

type Action =
  | { kind: 'removeFloor'; cells: Cell[] }
  | { kind: 'addFloor'; cells: Cell[] }
  | { kind: 'openDoor'; id: string }
  | { kind: 'closeDoor'; id: string }
  | { kind: 'spawn'; entity: 'coin' | 'bug' | 'bridge' | 'hint'; cells: Cell[] }
  | { kind: 'damage'; amount: number }
  | { kind: 'message'; text: Localized }
  | { kind: 'teleport'; cell: Cell }
  | { kind: 'checkpoint'; id: string };
```

Effects are evaluated **after an accepted key**, plus once at level start.
There is no polling in campaign puzzles.

### Effect predicates (initial set)

| effect id | observable state |
|---|---|
| `quote-content-changed` | inside `"..."`, text changed, delimiters unchanged |
| `word-removed` | a specific token disappeared without touching its neighbours |
| `register-has` | register name contains exact text |
| `lines-sorted` | marked range is sorted |
| `no-token` | token absent from buffer |
| `search-found` | last search pattern matches target |
| `macro-applied` | buffer changed on N marked lines in one undo block |
| `case-flipped` | target region's case changed |
| `count-satisfied` | a numeric/count condition met |

These are checked against the real Vim buffer/cursor/registers, so a macro or
dot-repeat can satisfy them.

## 5. Fairness and reset rules

1. **No unavoidable one-shot trap.** A verified solution exists; the solver
   resets the run rather than soft-locking.
2. **Reset restores everything** (collapse tiles, plates, doors, spawned cells).
3. **Vim `u` does not resurrect a consumed meta-cell.** The HUD states this;
   `u` is for text, retry is for the room. This avoids treating engine undo as
   a puzzle cheat or a hidden second state machine.
4. **One-way opens by default.** A door may close only with a visible timer and
   a reset path.
5. **No hidden triggers.** A plate/lock has a readable shape, hover/line label,
   and codex entry. Hints can reveal the predicate.
6. **Stuck detector.** If reachable coins/exit drop to zero, offer RETRY rather
   than silently trapping the player.
7. **Turn-based campaign.** No bug-time pressure in a puzzle stage; LIVE bugs
   remain a separate mode.

## 6. Puzzle examples (verified, not implemented yet)

### A. The Causeway
A one-cell bridge across a void. Cross it and the tile behind collapses. The
only return is a loop through a lower path. Teaches: one-shot floors, route
planning, `F2` reset.
Devices: `collapse` × 6, `plate` × 1.
Vim skill: `w`/`b`/`f` routing, no text edit required.

### B. The Wordlock
Three `ROT` tokens are welded into a sealed door. Delete all three **without
touching the two KEEP words**. A bridge extends one cell per removed ROT.
Vim skill: `*`, `n`, `daw`, dot repeat.
Effect: `no-token` ROT + `word-removed` constraints; deleting KEEP spawns an
errata/damage.

### C. Quote Gate
A door opens when the string literal is changed but its quotes remain. `ci"`
works; `di"` removes the content but also fails the quote-intact predicate;
`x` on a quote fails. Teaches text objects and effect-based locks.

### D. Register Vault
A plate checks that register `a` contains the line `MOTH`. The player must yank
it, not retype it. Opens a bridge and records a codex fragment.
Vim skill: `"ayy`, `"ap`, register inspection.

### E. Sort the Procession
Three plates are numbered by the sorted order of three marked lines. `:sort`
or `Vj:sort` aligns the bridge. Teaches ex ranges and order as state.

### F. Search for the Unwritten
A hidden bridge is revealed only when the player searches for `MOTH`; `*` on a
different word does not count. The bridge is temporary unless a plate is
pressed. Teaches `/`, `n`, `*`, and intentional search.

### G. One-Way Cathedral
A vertical shaft of collapsing floors. The player must descend using `}`/`G`/
search, not wander. Wrong route can strand; reset is one key. This is the
"head-scratching" spatial puzzle.

## 7. Story integration

Devices are the **author's revision machinery**, not arbitrary video-game props:

- collapsing floor = a sentence the city can only read once;
- wall = a redaction the author made permanent;
- plate = a memory that responds to being stepped on;
- command lock = a revision that requires the right *kind* of edit;
- bridge = a sentence restored between two deleted ones;
- sequence = the order of a paragraph, which the city remembers;
- hidden search path = MOTH exists only while searched.

The Redactor uses red barriers and one-shot redactions; ORACLE explains the
predicate; MOTH leaves hints; JANITOR's route is a sequence clue.

## 8. Architecture and tests

New modules:
- `src/core/game/puzzle.ts` — DeviceSpec, PuzzleState, trigger evaluation;
- `src/core/game/puzzle-solver.ts` — BFS/DFS over cursor×device state for
  authored levels; validates solvability and no soft-lock;
- renderer: meta-cell layer (walls/floors/plates/doors) + FX for transitions;
- UI: legend, device inspector, reset/stuck prompts;
- level lint: replay authored solution with devices, assert par/gates;
- tests: each effect predicate, one-shot reset, undo does not resurrect meta,
  wall guard, solver rejects unavoidable traps.

Budget: device layer is small (~10–14 kB raw together with meta-grid and
render hooks), but it depends on the LIVE framework; measure before raising.

## 9. Delivery order

1. Build with **one device type** (`collapse`) in one puzzle arena.
2. Add `plate` + `lock` with effect predicates.
3. Add sequence/register/search puzzles.
4. Only then consider campaign **post-clear** versions; first clears stay frozen.
5. Add story/visual pass and hints.

## 10. Anti-goals

- no real-time pressure in deterministic puzzles;
- no exact-key triggers that macros/dot/`:normal` can bypass or that punish
  legitimate equivalent edits;
- no invisible/undiscoverable triggers;
- no one-shot device that makes a stage unwinnable without reset warning;
- no campaign par rewrite to accommodate a new device;
- no fake "puzzle" that is just a hidden wall.

## 11. Open decisions for the human

1. **One-shot rule:** should a consumed floor disappear immediately under the
   player (with a teleport/fall) or only after leaving it? Recommendation:
   after leaving, never under the player.
2. **Vim undo:** should `u` undo device state? Recommendation: **no**; retry
   resets the room. Otherwise devices and undo create two conflicting state
   machines.
3. **Exact commands:** should a lock ever require the literal `ci"` rather than
   the observable "quoted content changed"? Recommendation: effect predicate
   for fairness; display the intended command as a hint.
4. **Campaign timing:** new devices only in post-clear/remix or a new chapter?
   Recommendation: post-clear first; new chapter later.
