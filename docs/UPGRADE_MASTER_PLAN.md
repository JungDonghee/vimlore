# VIMLORE upgrade master plan

> Status: design contract, written **before** implementation (2026-11-13).
> The current green state (51 of 51 stages, oracle 373, PWA) is frozen while
> this plan is executed. Do not mix a new gameplay system with campaign gates
> in one unverified change.
>
> Ordering decision: **gameplay/feel → story → full Practical Vim engine**.
> The engine order is deliberately inverted from the old backlog: the game
> must be worth playing before the command surface grows.

## 0. One-screen decision

| question | decision |
|---|---|
| Do dynamic bugs/walls/health go into the 51 campaign stages now? | **No.** Campaign stays deterministic and oracle-clean. |
| Where does the dynamic system live first? | A separate **LIVE CIRCUIT** arcade mode using the same Vim engine and a generated arena. |
| What is "Practical Vim full"? | A written **PV-FULL** contract: every one of 123 tips is playable, a verified drill, or an explicitly environment-deferred row with a feature backlog. No unknown gaps. |
| What is the story? | An original novel-like arc, delivered in prologue, 10 chapter epigraphs/interludes, codex fragments, ROT transmissions and ending choices. See [`STORY_BIBLE.md`](STORY_BIBLE.md). |
| What is the first shippable slice? | One LIVE arena: moving bugs, red walls, corruption, health, timer, score, pause/accessibility, no campaign changes. |
| What is explicitly not first? | Buffers/windows/files engine, full Modern Vim, multiplayer, accounts, servers. |

## 1. Non-negotiables

1. Existing campaign gates stay green: **51 of 51** solution+undo, oracle 373,
   level lint, matrix/count, docs/status, PWA/offline.
2. A dynamic hazard must **never make a generated arena unavoidable** or a
   campaign solution nondeterministic.
3. Every new system has a seeded replay/QA path; no "random feels fair".
4. No fake story text, no copied Drew Neil prose, no fake Modern Vim levels.
5. Performance: arena FX must be allocation-light; existing desktop/mobile FPS
   gates and bundle budget are measured, not waived.
6. Accessibility: pause, reduced motion, slower bugs, color+shape legend,
   keyboard-only.

## 2. Current baseline (freeze point)

- Campaign: 10 chapters / 51 stages; **51 of 51** game-used solution+undo.
- Oracle 373 of 373; grammar 21,712; count 162; 88 Grimoire commands.
- Full-state debt 119 (undo/register) and fuzz debt 3 (visual edges).
- Practical Vim: 48 of 123 tips represented; 75 gaps = 39 drill candidates,
  28 deferred surfaces, 8 review.
- Modern Vim: 28 tips, 0 playable (deferred).
- Bundle: 277,879 raw / 86,157 gzip (ceiling 278,000 / 87,000); ~121 B raw
  headroom. Any real feature requires a deliberate budget decision.
- PWA installability 0 errors; offline; landscape gate; 50-screen audit clean.

## 3. Workstreams and ownership boundaries

### W1 — LIVE gameplay system (first)
A game-layer director around the existing `Session`/`Vim`, not a fork of the
engine.

### W2 — Narrative system (parallel with W1, integrated after W1 loop works)
Story data + delivery surfaces; no engine changes.

### W3 — PV-FULL engine (after W1/W2 vertical slices)
Editor program + per-tip oracle/drill coverage.

### W4 — Modern Vim (after W3)
Only after buffers/windows/quickfix/terminal/plugin surfaces exist.

### W5 — Presentation/polish (continuous)
Visual language, audio, onboarding, accessibility, GitHub/README.

## 4. LIVE CIRCUIT — architecture

### 4.1 Why a separate mode

The 51 campaign stages are a **sealed deterministic simulation**. Their value
is that a solution is provably the same every run and can be diff-tested against
Vim. Moving hazards add time and randomness; mixing them into first clears would
break fair par, level-oracle reproducibility and the "learn one command"
contract.

LIVE CIRCUIT is an **arcade layer with the same real Vim engine**:
- arena text is a Vim buffer;
- the player still moves with real Vim commands;
- hazards live in a **meta layer** (cells outside the text semantics);
- health/timer/score are game state, not Vim state;
- a generated arena is seeded and re-playable.

After the arcade is proven, campaign **post-clear modifiers** can opt into the
same director without changing first-clear gates or par.

### 4.2 Components

```
LiveArena (seed)
├── buffer text + collectibles + corrupt chars
├── LiveSpec { walls[], bugs[], coins, timeLimit, hearts }
├── HazardDirector
│   ├── seeded RNG
│   ├── tick scheduling
│   ├── bug AI (patrol-row / patrol-col / random / later stalker)
│   ├── collision + invulnerability
│   └── phases (calm → pulse → swarm)
└── WallGuard (game layer, not engine)
```

### 4.3 Walls and corruption (distinct)

| object | visual | rule | player response |
|---|---|---|---|
| **red wall** | solid red block with hatch | immutable; cannot be entered; cannot be edited | route around it with motions/search |
| **corrupt text** | red/amber glyph `X` | damages signal on contact; can be deleted/overwritten with Vim | use the lesson's edit command |
| **bug** | moving amber/red sprite with trail | contact damages once per invulnerability window | move, delete, wait, use a wall |
| **coin / memory shard** | white/cyan glyph | collect by landing on it | all collected = circuit stable |
| **exit / repair cell** | green gate | optional mission objective | reach after collection |

WallGuard:
- record cursor and buffer version before a normal/visual key;
- if the resulting cursor is on a wall **and the buffer version is unchanged**,
  restore the cursor and emit `WALL` feedback (no damage);
- if an operator changed the buffer, do not roll back the edit; the wall stays
  visually and physically (it is meta, not a character);
- never touch engine internals from the guard.

### 4.4 Bug AI (v1)

| type | motion | constraints |
|---|---|---|
| `patrol-row` | one cell left/right, reverse at bounds/wall | no wall entry; 700–950 ms step |
| `patrol-col` | one cell up/down, reverse | same |
| `random` | one of 4 directions, seeded | avoid walls; short memory to avoid jitter |
| `stalker` (later) | greedy one step toward cursor | capped speed, not before phase 2 |

Rules:
- no spawn within 2 cells of start, coins, or the current cursor;
- no two bugs on the same cell;
- pause while intro/results/help/exit overlay is open;
- pause while `document.visibilityState !== 'visible'`;
- telegraph the next move for 220 ms (direction pulse) before committing;
- after a hit: 1.2 s invulnerability, bug respawns away from the player;
- arena connectivity/reachability is verified before shipping.

### 4.5 Health, timer, score

- **Signal** (hearts): 5 in LIVE v1. Bug or corrupt text = 1; walls = block,
  no damage. 0 = derez/lost.
- **Timer**: 75 s in v1; HUD counts down; collectibles can add +5 s (later).
- **Score**: coins × time bonus × no-hit bonus; separate from campaign par and
  stars. Never write live damage into campaign records.
- **Checkpoint**: one mid-arena signal checkpoint after 50% coins (v1.1).
- Campaign hearts remain exactly as they are today; no silent retune.

### 4.6 Difficulty and fairness

- Seed is shown; DAILY uses a fixed seed; retry uses the same seed by default.
- No unavoidable spawn/damage. The arena generator validates:
  - start and all coins reachable ignoring bugs but respecting walls;
  - walls do not seal the arena;
  - bugs spawn at safe distance;
  - a straight-line solution exists for verification (not necessarily optimal).
- A colorblind legend uses **shape + pattern + label**, not hue alone.
- Reduced-motion mode disables trails/shake but keeps telegraphs.
- Bugs can be frozen by a "hold" key? Later; v1 has pause (`P`/Esc overlay).

### 4.7 Performance

- Bug sprites preallocated; draw in the FX pass, not the cached glyph layer.
- No per-frame DOM; HUD updates only on state change (heart/coin/second).
- Cap bugs at 12; arena ≤ 40×18 cells; one RAF loop shared with PlayScreen.
- Budget: dynamic slice must stay ≥50 FPS mobile, ≥50 desktop headless and
  add no more than a measured fixed bytes ceiling (see §8).

## 5. Visual/feel language

Semantic palette (also used in campaign hazards where safe):

| meaning | color | shape |
|---|---|---|
| player/cursor | cyan-white block | solid cursor |
| valid/neutral | phosphor green | grid/frame |
| **corruption / damage** | **red** | `X`/hatch |
| **wall / redaction** | **deep red** | solid block + diagonal hatch |
| **ROT bug** | amber-red | moving glyph/sprite with trail |
| memory/coin | white-cyan | diamond/shard |
| goal/exit | green | outlined gate |

Typography:
- one monospace family for terminal data; no decorative "AI cyber" gradients;
- micro-labels tracked; red reserved for danger, never decoration;
- animations: 120–200 ms telegraphs, 80 ms hit flash, no constant shaking.

Characters (visual):
- **CURSOR**: the player, a block with a thin wake;
- **ERRATA** (bugs): six-legged bracket shapes, each type distinct;
- **ORACLE**: a blind vertical eye / diagnostic column;
- **ROT / REDACTOR**: red editorial marks, never a generic monster;
- **MOTH**: paper shard / search highlight that flickers when named.

Onboarding:
- first LIVE run shows a 4-line legend overlay: MOVE, COLLECT, AVOID, WALL;
- a one-key `?` legend during play;
- no new command vocabulary required in v1 (hjkl/w/b/f/t/search all work).

## 6. Narrative system

See [`STORY_BIBLE.md`](STORY_BIBLE.md). Delivery contract:

| surface | content | frequency |
|---|---|---|
| title / prologue | one scene, skippable, replayable | first boot + archive |
| chapter epigraph | 2–4 lines, chapter voice | chapter select |
| chapter interlude | 250–600 words | after all chapter stages cleared |
| codex | author notes, character fragments, definitions | unlocked progressively |
| LIVE transmissions | ROT/ORACLE lines, no plot-critical info | between waves |
| ending | 3 choices, one hidden condition | after c10 |

Rules:
- no copied book prose; Drew Neil books are curriculum metadata, not story text;
- localize to Korean and English in `Localized`;
- story cannot block gameplay; every overlay is skippable;
- unlock with progress, not with a server/account;
- codex entries are readable offline;
- no spoilers in README/store copy.

## 7. PV-FULL — Practical Vim complete boundary

PV-FULL is a **contract**, not "implement every Vim feature".

### 7.1 Coverage rule

Every Practical Vim tip (1–123) must end in exactly one bucket:

1. **STAGE** — a deterministic campaign stage (existing 48 tips + new ones).
2. **DRILL/GOLF** — simulation-verified challenge citing the tip line.
3. **LIVE MODIFIER** — a verified live arena mechanic that exercises the tip.
4. **ENV-DEFERRED** — blocked by a named environment feature; the feature has a
   design entry and an oracle plan. Explicitly approved, never "forgotten".

The build must refuse an **UNKNOWN** bucket.

### 7.2 Feature groups and order

| group | tips (examples) | required surface | complexity |
|---|---|---|---|
| A core drills | 4,7,13–18,31–36,62,64,69–87,90–100 | insert registers/digraphs, ex history, advanced regex, substitute, macro edit | M |
| B files/buffers | 37–46,57–59 | VFS, buffer registry, argument list, splits/tabs, marks | L |
| C quickfix/tools | 102–111 | quickfix, ctags adapter, compile/grep adapters | L |
| D completion/spell | 112–123 | completion sources, spell dictionary | M |
| E environment boundary | shell-specific tips | browser VFS only; no real `:!` | deferred |

Order: A → B → C/D, each with oracle cases first. Modern Vim remains W4.

### 7.3 PV-FULL acceptance

- `PV-COVERAGE.md` generated from the 123 tips: 0 UNKNOWN, counts per bucket.
- every STAGE passes level-oracle; every DRILL passes simulation and has a
  citation; every LIVE modifier has a deterministic test; every ENV-DEFERRED
  has a named feature and approval.
- No campaign par changes unless a deliberate content migration is approved.
- The engine score can then move from ~55 to ~80+; it is not claimed at 100
  because Modern Vim and full editor features remain separate.

## 8. Bundle/performance budget decision

The current bundle has ~121 B raw headroom, so this plan cannot be implemented
inside 278,000 B.

- **Phase 1 (LIVE slice)** estimate: +8–14 kB raw (director, sprites, HUD,
  wall guard, tests).
- **Phase 2 (story vertical slice)** estimate: +8–12 kB bilingual (prologue,
  one interlude, codex, transmissions).
- Full story (10 chapters/endings): +20–35 kB raw.
- Target after measurement: **≤ 320,000 raw / ≤ 100,000 gzip**, with a
  deliberate budget commit; if the slice exceeds it, cut content, do not waive
  the ceiling silently.
- Story text may be lazy-loaded as a cached `story.json` if initial bundle
  growth hurts first paint; decide only after measuring the vertical slice.
- FPS gates unchanged; a dynamic feature that drops mobile below 50 FPS is a
  failure, not a tradeoff.

## 9. Delivery phases and exit criteria

### P0 — Plan and freeze (this document)
Exit: plan/story/scope reviewed; current gates green; no feature code mixed in.

### P1 — LIVE vertical slice (no campaign/story changes required)
- one arena, 3 bug types, 2 walls types, corrupt text, 5 hearts, 75 s timer;
- HUD + legend + pause/accessibility;
- seeded arena verifier + fairness tests + browser QA;
- campaign gates unchanged.
Exit: 100 seeded arenas validated, no unavoidable spawn, campaign 51/51,
mobile ≥50 FPS, budget measured and deliberately raised.

### P2 — Story vertical slice
- prologue, c01 epigraph + interlude, 6 codex entries, ROT transmissions;
- skippable, localized, no book text;
- archive screen reachable from codex.
Exit: playthrough reads coherently; no story blocks controls; link/doc checks.

### P3 — Campaign + story integration
- chapter interludes for all 10 floors;
- post-clear LIVE modifiers; first-clear deterministic;
- character/corruption visual pass across campaign.
Exit: all campaign gates unchanged; story pacing reviewed; live modifiers optional.

### P4 — PV-FULL engine
- group A → B → C/D; oracle-first;
- generated PV coverage; no UNKNOWN.
Exit: PV-FULL coverage report, 51/51 or approved migration, docs.

### P5 — Modern Vim
Only after PV-FULL and editor surfaces; deferred otherwise.

### P6 — Polish
Art/audio, endings, accessibility, release presentation.

## 10. QA and metric gates

Existing:
- tsc, tests, level lint, doc-check, invariants, surface strict;
- oracle, level-oracle solution+undo, matrix, count;
- build, budget, status, PWA check, presentation check;
- browser QA/audit, PWA QA.

New:
- `npm run live:verify` — 100 seeds: reachability, wall connectivity, spawn
  fairness, bug movement invariants, no duplicate cells, time/health bounds.
- `npm run live:qa` — deterministic replay + pause + reduced motion + FPS.
- story check — every chapter has epigraph/interlude/codex; localization keys;
  no empty text; no copied snippets (manual review).
- campaign regression on every P1/P3 change.

## 11. Risks and mitigations

| risk | mitigation |
|---|---|
| dynamic hazards ruin Vim learning | separate LIVE mode first; campaign untouched until post-clear opt-in |
| randomness feels unfair | seeded arenas, telegraphs, invulnerability, verified reachability, pause |
| bundle/FPS regression | measured budget decision; FX-only sprites; cap entities; mobile gate |
| story becomes exposition dump | short epigraphs/interludes, environmental/codex delivery, skip, novel bible |
| scope creep into full Vim | PV-FULL contract with UNKNOWN=0 and feature order |
| "AI slop" visuals | semantic palette, custom shapes, design notes, no stock gradients |
| overtime red state | one phase per branch, gate before commit; revert if gates worsen |

## 12. Immediate next actions (after approval)

1. Implement `LiveSpec` types + `LiveArena` generator + verifier (no UI yet).
2. Add `HazardDirector` + WallGuard behind a `live` host flag; no campaign path.
3. Add LIVE HUD/legend + red wall/corrupt/bug rendering + pause/reduced motion.
4. Add TRIALS entry `4 · LIVE CIRCUIT` and one story transmission (no spoilers).
5. Measure bundle/FPS; commit a deliberate budget raise with evidence.
6. Only then start the story vertical slice; only after that touch PV-FULL.

Do **not** start with a full engine rewrite, a new server, or a campaign-wide
hazard retrofit. Those are the three fastest ways to lose the green state.
