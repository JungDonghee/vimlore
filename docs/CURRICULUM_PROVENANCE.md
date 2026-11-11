# CURRICULUM PROVENANCE — the ten books are the curriculum authority

> **Why this file exists.** VIMLORE must not be “an AI invented 51 plausible
> Vim puzzles”. The curriculum is supposed to be a **gradual, natural, almost
> painless path through professional Vim material**. The ten source books listed
> below are the authority for *what* is taught, *in what order*, and *why*.
> The engine is tested against real Vim; the curriculum must be traceable to the
> books the same way.
>
> **Current status: the chapter-level themes align with the books, but a
> section-level provenance audit has NOT been completed.** Do not claim that all
> 51 stages are already book-derived. This file defines the audit and is the
> handoff contract for doing it honestly.

## 1. Source corpus

All ten books are extracted to `books-text/*.txt` (gitignored, ~78k lines total):

| file | book | primary strengths |
|---|---|---|
| `learning-vi-vim.txt` | Learning the vi and Vim Editors | fundamentals, motions, ex, gradual basics |
| `practical-vim.txt` | Practical Vim | tips, text objects, registers, macros, `:g`, workflows |
| `pro-vim.txt` | Pro Vim | broad language coverage, advanced editing, tooling |
| `modern-vim.txt` | Modern Vim | Neovim, terminal, modern workflow, plugins/UI |
| `vim-101-hacks.txt` | Vim 101 Hacks | compact tips, practical shortcuts |
| `gourmet-vim.txt` | Gourmet Vim | polished recipes, combos, efficiency |
| `vim-reference-guide.txt` | Vim Reference Guide | command reference, option/ex breadth |
| `use-vim-like-a-pro.txt` | Use Vim Like A Pro | workflow, navigation, habits |
| `5-years-of-vim.txt` | 5 Years of Vim | lived-in tips, gotchas, real usage |
| `neovim-for-beginners.txt` | Neovim for Beginners | gentle onboarding, Neovim basics |

This corpus is the raw material. A book mention alone is not provenance; the
audit needs a chapter/section and a concrete command/insight.

## 2. The non-negotiable rule

**No new stage, chapter, command lesson or curriculum reorder may be invented
from plausibility.** Before authoring content:

1. locate the concept in at least one source book;
2. record book + chapter/section (or a stable heading/line range);
3. place it in the prerequisite graph;
4. only then write the stage and its `par`.

If no source supports a concept, it is not curriculum yet. It may be an engine
feature (tested by the oracle) without being taught; that distinction is fine.
If a stage has no citation, mark it `provenance: missing` and fix it before
calling the curriculum book-derived.

The existing 51 stages are **frozen content** in this program; provenance work
annotates and validates them, it does not add stages. Stage count remains
elastic.

## 3. Current honest status

| thing | status |
|---|---|
| 10 books extracted | yes (`books-text/`, 78,492 lines) |
| chapter themes (movement → words → operators → objects → visual → search → registers → marks → ex → mastery) | broadly aligned |
| per-stage `teaches` command ids | present for 51/51 |
| per-stage **book + section citation** | **missing / unaudited** |
| prerequisite graph | informal; not machine-readable |
| pacing metrics (new commands/stage, review ratio, par ramp) | not measured |
| gap list of book topics outside the 51 | partial (see §6) |

This table is intentionally embarrassing: it prevents the next AI from
mistaking “the chapters feel right” for provenance.

## 4. Audit method (the next curriculum program)

### Step 1 — build a book index

For each book, extract a heading-level table of contents and tag sections with:

- concept ids (`motion.w`, `operator.d`, `object.iw`, `register.named`,
  `macro.record`, `ex.g`, `window.split`, …);
- difficulty (intro / working / advanced / reference);
- prerequisites implied by the text;
- a short quote or line range for the citation.

Store as `BOOKS_INDEX.md` (human) and, when useful,
`docs/books-index.json` (machine). Keep the raw books gitignored; the derived
index may be committed if it contains only our summaries and short citations.

### Step 2 — merge into one prerequisite graph

The ten books overlap and disagree on order. Resolve with **gradualness first**:

- a concept appears after every concept it depends on;
- one new *command family* per stage at most (a count, an object name or a
  register rule may be the single insight);
- review is deliberate: each chapter reuses earlier commands in a new shape;
- no stage requires a command that has not been taught unless the stage's
  `teaches` explicitly introduces it;
- `par` grows by at most ~1 per stage, with integration stages allowed to be
  longer but not to introduce unrelated commands.

If two books suggest different orders, choose the gentler one and record the
other as an optional advanced path.

### Step 3 — annotate every stage

Add a provenance record per stage (proposed schema; not yet in `Stage`):

```ts
sources: [
  { book: 'practical-vim', section: '...', concept: 'object.iw', note: '...' },
]
```

Until the schema exists, keep the mapping in `docs/CURRICULUM.md` or a dedicated
table. A citation must identify a **section**, not just a book title.

For each stage record:

- source(s) and the exact insight;
- prerequisite concept ids;
- new command(s) — ideally one;
- review commands;
- why `par` is the elegant count;
- what the player should transfer to real Vim.

### Step 4 — measure “painless”

Proposed acceptance metrics (tune after baseline):

- **novelty**: ≤ 1 new command family per stage; ≤ 2 new key bindings;
- **dependency**: 0 forward references (every prerequisite is earlier);
- **review**: ≥ 30% of keystrokes in a chapter reuse earlier concepts;
- **ramp**: `par` increases gradually; no >2× jump between adjacent stages
  without a review stage;
- **failure cost**: no stage can soft-lock; `u` always rescues;
- **clarity**: LEARN/GOAL/PAR visible before typing; hazards explained;
- **transfer**: every stage's solution is real Vim, oracle-tested.

These are curriculum metrics, not engine metrics. They belong in the audit
report, not in `lint:levels`.

### Step 5 — close gaps

List book topics not covered by the 51 (see §6), rank by teaching value, and add
them only in a later curriculum program. Do not silently treat “not covered” as
“not needed”.

## 5. What the next AI must do before touching curriculum

1. Read this file, `CURRICULUM.md`, and the ten source books (at least the
   sections relevant to the proposed change).
2. Check whether the concept already has a citation; never duplicate a lesson.
3. If adding/changing a stage: write the provenance record first, then the
   stage, then `lint:levels`, then update `LEVELS.md`/`CURRICULUM.md`.
4. If a stage has no citation: mark it, do not pretend it is book-derived.
5. Keep engine fidelity separate: a command can be engine-supported and tested
   by the oracle before it is taught.

## 6. Known book-topic gaps (initial, not exhaustive)

These are present in the corpus but not yet part of the 51-stage curriculum:

- buffers, alternate/hidden buffers, `:b`/`:bn`/`:bp`/`:bd`/`:bufdo` (deferred
  editor program; see `FUTURE_EDITOR.md`);
- files/VFS `:e`/`:r`/`:w`, splits/windows/tabs/`<C-w>`;
- folds, completion, quickfix, `:make`, terminal/`:!`;
- `:earlier`/`:later`, undo tree, persistent undo;
- `=` indent with filetype rules, `formatoptions`, `textwidth` workflows;
- options/`vimrc`, mappings, autocmds, plugins/Neovim Lua (reference breadth,
  likely “read about” rather than playable stages);
- advanced regex (`\zs`/`\ze` engine support exists; teaching path not audited);
- change list (`g;`/`g,`), `gi`/`gI` teaching paths;
- registers beyond the basics, expression register, macro composition patterns.

Engine support and curriculum coverage are separate axes. `VIM_COVERAGE.md`
tracks the engine; this file tracks what is taught and why.

## 7. The one-sentence handoff

**The ten books are the syllabus; the engine is the simulator; the oracle keeps
the simulator honest; this file keeps the syllabus honest.**
