# STATUS — generated
> **Do not edit by hand.** Run `npm run status:write` after regenerating the
> oracle/matrix/count/state reports and the build. `npm run status:check` is a
> CI gate. Gzip is intentionally omitted: local zlib-ng and CI stock zlib
> differ; the bundle budget owns that (gzip ceiling 86,000 B).
| metric | value |
|---|---:|
| oracle cases | 373 |
| matrix command trees | 21,712 |
| count-matrix cases | 162 |
| manifest rows (counted) | 64 (54) |
| chapters / stages | 10 / 51 |
| state matrix matched / total / open | 21,539 / 21,712 / 173 |
| state open by field | undo 164, reg 10, regtype 8 |
| built single file (raw) | 270,287 B |
| raw ceiling | 271,000 B |
## Reports
- Oracle: `tools/oracle-diff.ts` + `tests/vim-expected.json`
- Grammar matrix: `npm run matrix` → `docs/MATRIX_REPORT.md`
- Count matrix + manifest: `npm run count-matrix` → `docs/COMMAND_MANIFEST.md`
- Observable state (local): `npm run state-matrix -- --write` → `docs/STATE_REPORT.md`
- Command/feature audit: `docs/VIM_COVERAGE.md`, `docs/VIM_ADVENTURES_COVERAGE.md`
- Debugging: `npm run trace -- --case=m-1234` → `docs/DEBUGGING.md`