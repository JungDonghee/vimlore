# Differential fuzz debt — visual-block / linewise edge cases

A 2,000-case seeded differential fuzz (`npm run fuzz -- --n=2000 --seed=42`)
found three real Vim divergences that the current stage/state gates do not
exercise. They are recorded, not waived. CI's fuzz smoke is 500 cases/seed 7;
do not claim a globally perfect engine while this is non-empty.

Repro list (local): `/tmp/vimlore-fuzz-failures-42.txt`

| id | text | cursor | keys | Vim | engine |
|---|---|---|---|---|---|
| fuzz-1069 | `a\nb\nc\nd` | 2,0 | `V)B><Esc>i!<Esc>` | `a`, `  b`, `  c`, `  d` | last line `d` not shifted |
| fuzz-1391 | `[1, 2, 3]` | 1,8 | `<C-v>)hy<Esc>i!<Esc>` | cursor col 8 | cursor col 7 |
| fuzz-1527 | `"hello world"` | 1,1 | `<C-v>)F"d<Esc>i!<Esc>` | `"` remains | `ello world"` remains |

Both are visual-mode range/curswant semantics, not shipped stage solutions:
`level-oracle` is 51 of 51 solution+undo and the 12 state classes in
`GAME_USED_STATE.md` are green. Treat these as the next engine task after the
deadline, with new oracle cases and a state-matrix shrinker.

## Rule

- Never change a stage to hide one of these.
- Add each repro to `tools/cases.ts` when fixed; keep the fuzz seed in CI.
- Prefer a Vim-curswant model for block Visual over per-motion patches.
