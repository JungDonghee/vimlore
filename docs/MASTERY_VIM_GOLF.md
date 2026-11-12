# Mastery loop and VimGolf

> The goal is not "the player has seen every command". It is **the hand reaches
> for the right command without translation**, across new text, then optimises.

## The loop

1. **Introduce** — one insight, a stage whose puzzle makes the command necessary.
2. **Drill** — restart/retry the same insight with varied text/cursor/count.
3. **Transfer** — use it in a different problem shape (TRIALS / later stages).
4. **Spaced review** — TRIALS weakness/daily after other concepts intervene.
5. **Golf** — beat par; compare `bestKeys`; ghost shows the canonical path.

The game already ships par/3-star, `bestKeys`, retry, F3 ghost, the DRILL cue,
TRIALS with weakness/daily selection, and the coach. The results screen now
frames the key gap as **GOLF** (par / +N over par / best) instead of a generic
"keys" line. When the clear is over par, **GOLF RETRY is the primary action**
and the focused button: the next repetition is the obvious next step. This is deliberate: the score is the lesson, not decoration.

## Why this forces thought

- **Par is not the only solution.** Hints/ghost show one path; GOLF asks for a
  shorter one. The player must choose an operator/motion composition.
- **Varied repetition.** TRIALS generators vary text, cursor, count, operator,
  nesting and medium; repeating one sentence is explicitly forbidden.
- **No fake mastery.** A command seen once is not mastered; a 3-star clear is
  evidence, not a certificate. The review queue keeps returning weak skills.

## Next increments (source-backed)

1. A **drill queue** after a stage clears: three short variants, one transfer,
   one delayed review, each simulation-verified.
2. A **GOLF deck** of 5–10 source-cited challenges (Practical Vim tips) with
   verified `par`/optimal keys and local best, never unverified generated goals.
3. **Hint budget** experiments: hint use should be visible in results and
   should not silently grant mastery. Do not punish learning so hard that a
   beginner stalls.
4. **Book-tip review map**: each GOLF challenge cites a priority-book line; the
  provenance overlay is the source of truth.

## Invariants for any new challenge

- Runs through the real engine; goal verified; one insight.
- No command outside the stage's gate.
- If generated: `verify()` must win on the last key, and tests must cover it.
- No extra runtime dependency; bundle/performance measured.
- Unknown/deferred features stay deferred; no fake levels.
