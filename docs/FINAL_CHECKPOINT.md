# FINAL CHECKPOINT — 2026-11-12 sprint

> Durable snapshot for the 23:58 KST final report. Regenerate measurements at
> freeze; do not hand-edit STATUS.md. If the tree is red, revert to this commit.
>
> HEAD: 4dac970 (verify with `git rev-parse HEAD`; later commits may be green)
> Working tree at checkpoint: clean.

## Verified green

| gate | result |
|---|---|
| tests | 39 of 39 |
| stage lint | 51 of 51 |
| oracle | 373 of 373 |
| level-oracle (solution) | 51 of 51 |
| game-used (solution + undo) | 51 of 51 |
| grammar matrix | 21,712 of 21,712 |
| count matrix | 162 of 162 |
| full state matrix | 21,593 of 21,712 (119 open) |
| stage provenance | 51 of 51 cited |
| browser QA | desktop 57.6 / mobile 60.5 FPS |
| browser audit | 38 screens, 0 overflow, 0 errors |
| bundle | 276,990 raw / 86,091 gzip (gate 277,000/87,000) |

## Honest debts

- `FUZZ_DEBT.md`: 3 visual edge cases from 2,000-case fuzz.
- `STATE_DEBT.md`: 119 full-editor state edge cases (game-used surface is 0).
- `CURRICULUM_SPINE.md` / `GAPS.md`: Practical Vim 48/123 tips represented;
  75 drill/deferred gaps.
- Modern Vim is deferred where the engine lacks buffers/windows/quickfix/
  terminal/plugins. No fake levels.
- 144fps is not validated; headless rAF is 60Hz/software here.

## Final freeze command list

```bash
npx tsc --noEmit
npm test
npm run lint:levels
npm run doc-check
npm run invariants
npm run surface -- --strict
node --experimental-strip-types tools/oracle-diff.ts
npm run level-oracle
npm run level-oracle -- --undo
npm run matrix
npm run count-matrix
npm run build
npm run budget
npm run status:check
npm run browser:qa
npm run browser:audit
```

Then commit/push, verify CI + Pages, update HANDOFF/STATUS, final report.
