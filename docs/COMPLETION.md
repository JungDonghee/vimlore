# Completion report — what "finished" means here

> **This is a model, not a measured property of the universe.** The weights and
> scores below are explicit so the claim can be argued with. Last audited
> 2026-11-13, HEAD `8bad992`, live Pages green.
>
> Short answer: the **playable core is ~90%**, the **Drew Neil two-book
> curriculum is ~32% by tip coverage**, and the **full product vision is
> ~67% (confidence ±7)**.

## Three lenses (do not collapse them into one number)

| lens | score | basis |
|---|---:|---|
| Playable MVP / game-used surface | **90%** | 51 stages, real-Vim solutions 51 of 51 (solution and undo), core loop, PWA, offline, CI |
| Drew Neil curriculum (Practical + Modern) | **32%** | 48 of 123 Practical tips represented; 0 of 28 Modern Vim tips playable |
| Full product vision | **67%** | weighted matrix below; full Vim surface, content breadth, polish and Modern phase remain |

The 32% is **tip coverage**, not "39% of a game": the level spine/citations are
complete, but 75 Practical tips are still drill/deferred and Modern Vim has no
playable phase.

## Weighted matrix (full product)

Weights reflect the stated goal: a game that teaches Vim from Drew Neil's books
without a separate study habit.

| area | weight | score | weighted | evidence / gap |
|---|---:|---:|---:|---|
| Engine — game-used correctness | 20% | 100 | 20.0 | oracle 373 of 373; game-used solution+undo 51 of 51; matrix 21,712 |
| Engine — full Vim surface | 10% | 55 | 5.5 | single buffer; 119 full-state edges; fuzz debt 3; no buffers/windows/quickfix/terminal/plugins |
| Drew Neil curriculum | 25% | 35 | 8.75 | Practical 48 of 123 tips (39%); Modern 0 of 28; 51 of 51 citations; 19 intentional inversions |
| Level/content/replay | 15% | 65 | 9.75 | 10 chapters / 51 stages; 75 gap tips; no authored post-tower campaign |
| Mastery / GOLF / spaced review | 10% | 65 | 6.5 | par/3-star, best keys, F3 ghost, GOLF result, TRIALS weakness/daily; no full drill queue/deck |
| UX / visual / audio / PWA | 10% | 75 | 7.5 | CRT vector frame, grid, PWA install, landscape gate, offline; full HUD/art/audio depth missing |
| Production / QA / docs | 10% | 92 | 9.2 | CI, Pages, installability 0 errors, browser audit 50 screens, docs/gates; no release process |
| **Total** | **100%** |  | **67.2** | **~67% full-product estimate** |

Scores are rounded to the nearest 5; the model's realistic uncertainty is
**±7 points**. Changing the definition (e.g. "a polished commercial game like
Vim Adventures") moves the number more than any code change in this table.

## Engine — detailed

### Green (game-used)
- **373 of 373** differential oracle cases match real `vim -u NONE`.
- **51 of 51** shipped stage solutions match final buffer/cursor/register.
- **51 of 51** match solution + undo diagnostic.
- **21,712 of 21,712** grammar-matrix cases, **162 of 162** counted cases.
- 88 Grimoire commands; surface audit strict is green (86 of 88 with engine
  evidence, 9 engine-only features, 0 orphan cases at last audit).

### Debt (not game-used)
- **119 full-state edge cases**: undo 110, register 10, register-type 8.
- **3 visual fuzz edges** from seed 42 / 2,000 cases: linewise `V)B`, block-yank
  cursor, block curswant/delete. `FUZZ_DEBT.md` has exact repros.
- Missing domains: buffers/argument list/hidden files, splits/windows/tabs,
  files/netrw/`:w file`, folds, completion/abbreviations, filetype indent,
  change list, system clipboard, undo tree/persistent undo, filters/shell,
  quickfix/ctags/LSP, Vimscript/mappings/autocmd/plugins, interactive
  `:s///c`, viewport/mouse commands. Design: `FUTURE_EDITOR.md`; boundary:
  `VIM_COVERAGE.md`.

**Why full-surface score is 55:** the taught single-buffer core is unusually
strong (oracle+matrices+game-used zero), but "Vim mastery" includes the editor
surface above; calling the engine globally perfect would be false.

## Drew Neil curriculum — detailed

### Practical Vim (playable phase)
- 51 stages across 10 chapters; all have evidence-checked citations
  (`STAGE_MAP.md`, `STAGE_PROVENANCE.md`).
- **48 of 123 tips** are represented by at least one stage (39.0%).
- **75 gap tips**: 39 engine-supported drill candidates, 28 deferred-surface
  items, 8 review candidates (`GAPS.md`).
- The game does not follow literal tip order: Practical opens with the dot
  command (Tip 1) but introduces h/j/k/l at Tip 47. The map records **19 global
  tip-order inversions** to keep prerequisites sane; c01 uses a starter
  supplement for basics Practical assumes.

### Modern Vim (deferred phase)
- **28 tips**, mostly packages, fzf/projections, quickfix, terminal buffers,
  sessions and configuration.
- **0 of 28 playable.** The single-buffer engine cannot host honest levels for
  those surfaces; no fake levels. The plan is: finish Practical correctness,
  extend the editor program, then add a MODERN phase verified against Vim.

### Supplements
- 10 books indexed, 78,502 source lines, 2,554 audited headings; 8 books beyond
  the two Drew Neil books are supplements, not parallel syllabi.

## What raises the number

| change | rough full-product gain | constraint |
|---|---:|---|
| Add verified drills/GOLF for 39 supported Practical gaps | +3 to +5 | every challenge simulation-verified; no fake tip coverage |
| Author/port the 28 deferred-surface Practical gaps | +2 to +4 | needs files/windows/quickfix/tags |
| Build Modern Vim phase (buffers/windows/quickfix/terminal) | +5 to +9 | editor program; tests and oracle first |
| Close 119 state edges + 3 fuzz edges | +2 to +4 | Vim-faithful cursor model, no stage hacks |
| Full mastery queue/GOLF deck/spaced scheduler | +2 to +3 | content + UX |
| Full vector HUD/art/audio pass | +1 to +3 | bundle/perf budget |
| Release/package/community workflow | +1 | not core learning |

## Comparison in one line

Against **Vim Adventures**, VIMLORE is ahead on **real-engine fidelity, price
(free), offline/PWA and book citations**, and behind on **hand-authored
adventure content, visual/audio production, editor-surface breadth and brand
maturity**. It is not yet a finished commercial peer; see
[`COMPARISON.md`](COMPARISON.md).

## Keep this honest

- Update this file when a metric or phase changes.
- Never change a weight or score to make a milestone look complete.
- `STATUS.md` is generated; this file is a judgment layer and must cite it.
- Do not claim 144fps, full Vim, or full Drew Neil coverage without measurements
  and the missing rows becoming genuinely playable.
