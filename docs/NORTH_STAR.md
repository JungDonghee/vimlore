# NORTH STAR — VIMLORE

> Read this before the sprint plan, handoff, or any tool-specific doc. It is the
> compressed intent that must survive context loss. If a choice conflicts with
> this file, stop and reconcile it explicitly.

## One sentence

**VIMLORE is a real-Vim game that takes a player from first keystroke to
advanced Vim mastery through Drew Neil's Practical Vim and Modern Vim, with
deliberate practice and VimGolf, without requiring a separate course.**

## Non-negotiables

1. **Vim truth.** Every taught behaviour must exist in real Vim. The engine is
   diff-tested; every shipped stage solution is replayed in real Vim
   (`level-oracle`). Fix levels, never invent Vim semantics.
2. **Game-used correctness is zero.** A known divergence in a command, stage,
   goal, gate or UI path the game ships is a bug. Full-engine edge cases that
   are not game-used may be documented debts, not hidden.
3. **No fake features.** Buffers/files/windows/tabs/terminal/quickfix/LSP that
   the engine does not implement must not become pretend levels. Modern Vim is
   the second book, deferred where the engine lacks the surface.
4. **The books are the authority, not prose mimicry.** Practical Vim is the
   playable spine; Modern Vim is the next phase. Supplement gaps from the other
   books. Every stage has an evidence-checked citation. Do not silently rewrite
   source text; errata is explicit.
5. **Mastery, not exposure.** Introduce → drill → transfer → spaced review →
   VimGolf. Puzzles force a choice/insight; repetition is varied; par/3-star is
   a real target. A player should not need a separate Vim course.
6. **Performance is a feature.** No compromise for effects. Measure before and
   after. Target cheap-phone 60fps; do not claim 144fps without a 144Hz/GPU
   measurement. Never trade correctness for a prettier frame.
7. **Evidence and honesty.** Report exact metrics, failures, rejected evidence,
   and remaining gaps. Do not lower a gate, hide a red stage, or claim a fix
   that was not verified.
8. **Context survives handoff.** Important decisions, invariants and repeated
   instructions live in durable docs (`NORTH_STAR`, `SPRINT`, `HANDOFF`,
   `CURRICULUM_SPINE`, `BOOK_SOURCE_QUALITY`), not in chat memory. Update them
   whenever a decision changes.

## Book order (not parallel)

1. **Practical Vim 2e — Drew Neil (playable spine).** Tips 1–123, grouped by
   prerequisite and game pacing. 51 of 51 existing stages now have validated
   citations.
2. **Modern Vim — Drew Neil (second book, deferred).** Tips 1–28. Most content
   needs multi-buffer/windows/quickfix/terminal/plugin support; no fake levels.
3. Other eight books are **supplements** for fundamentals/gaps, never the
   spine.

## Current gate truth

- Engine oracle: 373 of 373; matrix: 21,712 of 21,712; count: 162 of 162.
- Stage lint: 51 of 51; **level-oracle: 51 of 51**.
- Stage provenance: **51 of 51 cited** (overlay, not bundled into the runtime).
- Full state matrix: 173 open (undo/register edge cases); game-used level
  solutions: 51 of 51; solution+undo diagnostic: 49 of 51. Game-used target
  remains 0, so full-engine perfection is still an open debt.
- Bundle: 276,145 raw / 85,955 gzip (gate 277k/87k).
- Browser desktop headless: 55.5 FPS, 38 screens 0 overflow/errors; 144 not
  verifiable here.

## If lost

Read `docs/SPRINT_2026-11-12.md` → `docs/HANDOFF.md` → `AGENTS.md`. Continue the
highest unfinished P0. Freeze risky edits at 23:40 KST; final gates/commit/push
by 23:58. Never end with an unverified claim.
