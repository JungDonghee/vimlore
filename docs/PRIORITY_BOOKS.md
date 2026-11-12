# Priority books — Drew Neil

`Practical Vim` (2nd ed.) and `Modern Vim` are the curriculum's primary pillars.
They are indexed with real Part/Chapter/Tip boundaries in
`books-index/priority/`; full text remains local-only.

## Structure

```bash
npm run books:priority
```

- `practical-vim`: 21 chapters, **123 body tips** (the early `Tip N.` lines are
  the table of contents and are excluded by the parser), 6 parts.
- `modern-vim`: 7 chapters, **28 body tips**.
- `books-index/priority/PRIORITY.md` lists every chapter/tip with exact line
  ranges. The chapter audit adds summaries, commands and concepts.

## Deep audit (2026-11-12)

```bash
npm run books:priority:merge
```

Same-model subagents read one chapter each (28 chapters total). Every
command/concept/defect had to cite an exact evidence line; the merge rejected
**0** mismatches. Results: `books-index/priority/audit.json` and
`PRIORITY_AUDIT.md`.

- Practical Vim: 21 chapters, **123 body tips**
- Modern Vim: 7 chapters, **28 body tips**
- **417 commands, 336 concepts, 175 defect candidates**
- Defect kinds: 80 garbled, **56 typo candidates**, 27 missing, 5 duplicated,
  4 order, 3 truncation
- The 56 “typos” include genuine prose errors (`exectuables`, `quiting`,
  `programatically`) and extraction artifacts (glued `Tip 7Finding`, curly
  quotes in code). They are **not auto-corrected**; see
  `books-index/priority/ERRATA.md`.
- These two sources have no numbered-chapter gap, but they are not
  publisher-authoritative: typographic-quote/code and flattened-table defects
  remain visible.

## Reading shortcuts

```bash
npm run books:priority:read -- toc practical-vim
npm run books:priority:read -- tip practical-vim 9
npm run books:priority:read -- chapter modern-vim 5
```

`CURRICULUM_MAP.md` is a **key-overlap** report, not semantic coverage: the
same key can mean different things in a different mode/context. Verify the
book meaning and stage before using it as curriculum evidence.

## Why these two first

- Practical Vim supplies the editing grammar (dot formula, motions, text
  objects, registers, macros, patterns, substitutions, quickfix).
- Modern Vim supplies the environment layer (packages, fzf, projections,
  terminals, sessions, configuration) that the later chapters touch.
- Other eight books remain secondary/supporting material.

This is an index/audit, not permission to copy the books. Do not commit
`books-clean/` or paste long passages into the game.
