# DIVINE MOVE — from engine fidelity to verified content

> Status: decided 2026-11-11 after the engine review. This is the product/technical
> direction for the next slices; `MASTER_PLAN.md` owns the task board and
> `HANDOFF.md` owns the live state.

## Why this move

The engine is now exact on the tested surface: **oracle 363/363**, **matrix
21,712/21,712**, all 51 stages, 28 tests, 12 fuzz seeds at n=1000 clean. Remaining
n=3000 divergences are rare visual-block/blank-line edges, recorded in
`HANDOFF.md` §3b.

That means the engine is no longer the bottleneck. Vim's semantics are an
infinite long tail; grinding it quirk by quirk has diminishing returns. The
project's real constraint is **verified content**: 51 stages against ten books,
with 46/51 stages still uncited. AI is a multiplier for *verification and
search*, not for inventing Vim's semantics.

The move: stop chasing Vim globally, and industrialize the loop around the
giant we already stand on — real Vim as oracle.

## Three tracks, in this order

### 1. Observable-state oracle (in progress)

The current matrix/fuzz compares **buffer + cursor only**. The game also cares
about mode, registers, undo, marks and jumps: `y`/`p`/`u`/`.`/`"a` can look
identical in the buffer and diverge on the next key.

Build `tools/state-matrix.ts` (local first, like matrix was):

- same generated command trees as `tools/matrix.ts`;
- record from Vim: buffer, cursor, **mode**, **unnamed/named register text and
  type**, **undo result after `u`**, and mark `'[`/`']` where meaningful;
- compare the same fields from the engine;
- report failures by field, not just "buffer diff";
- add `--filter`, `--show`, `--write` like matrix.

Acceptance: the tool runs; failures are catalogued; representative cases become
oracle cases. Only then may it become a CI gate. Do not weaken the existing
matrix/oracle gates while bringing it up.

First run (2026-11-11): `tools/state-matrix.ts` built; 15,289/21,712 matched,
6,423 open. Fixed a real operator leak (`c{` then `u` swallowed keys) and the
undo cursor policy for common cases; now 21,503/21,712, 209 open (undo cursor
941, register 32). 4 oracle cases added (363 → 363). Mode is not comparable in
`vim -es`; it needs a pty/Nvim probe before it can be asserted. Report:
`docs/STATE_REPORT.md`.

### 2. Corpus from the giants

Build `tools/corpus.ts` that **generates** differential cases from:

- Vim's own `src/testdir/test_*.vim` normal-mode sequences (extract command
  strings and setup text; do **not** vendor Vim files or copy large text —
  license-safe generation only);
- public VimGolf tasks (or equivalents) as end-to-end editing goals;
- short code/log snippets already in `books-text/` used as game texts.

Each candidate runs through the native Vim oracle and the engine; failures are
minimized (delete keys while the divergence persists) and promoted to
`tools/cases.ts`. Acceptance: corpus runs locally, divergences are minimized,
no license text is copied into the repo.

### 3. Level compiler

Build `tools/synth.ts` on top of the engine:

- input: a target command/skill, a candidate text, and optional count range;
- search BFS/A* over key sequences to find the shortest winning sequence;
- verify the target command is **necessary** (without it, no par solution);
- verify win on the last key and `par` equals the shortest path;
- emit a candidate stage in `src/content/chapters/cNN.ts` format plus a book
  citation candidate;
- run `npm run lint:levels` on the emitted stage.

Start with one skill (e.g. `ciw` or `>ip`), then expand. Acceptance: three
synthesized stages pass lint, have a measured authoring-time win, and cite a
book section (no invented lesson).

## Guardrails (non-negotiable)

- Oracle **363/363**, matrix **21,712/21,712**, tests **28**, level lint **51**,
  surface `--strict`, invariants, build/budget stay green.
- Zero runtime dependencies; no server; no embedded Vim/Neovim runtime.
- A deferred Vim feature is **deferred, not out of scope**; it enters the
  surface only with oracle proof. Never fake `:b`/`:sp` by mutating `Vim.buf`.
- New verification tools are local-only until they reach 0 divergences; do not
  add them to CI early and do not lower a ceiling to hide a failure.
- One bounded slice per autonomous run: implement, test, commit, push, verify
  CI + Pages, update `HANDOFF.md`; if a gate is red, fix or revert — never
  commit red.
- Push procedure: use the PAT outside the repo, then scrub the remote URL.
  Never print the token.
- Autonomous cutoff **2026-11-11 23:45 KST**: stop new work, finalize docs,
  ensure CI/Pages green. The machine shuts down at 00:00.

## What this is not

- Not a rewrite of the engine.
- Not embedding Vim/Neovim in production (8–10 MB WASM, RPC, loading latency,
  violates the phone/zero-dep budget).
- Not more random fuzzing for its own sake; every divergence must become a
  minimized oracle case or a documented edge.

## Definition of done for the move

- state oracle: 0 divergences over its generated set, or every remaining
  divergence documented and non-severe;
- corpus: ≥500 generated cases, 0 divergences, license note in docs;
- compiler: 3 synthesized stages, each with necessity proof + par + citation;
- then the roadmap shifts from "more engine commands" to **curriculum mastery
  loops** (introduce → drill → transfer → spaced review).
