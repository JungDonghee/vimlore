# Vim book corpus pipeline

The ten source books live in `books-text/` (gitignored). Full text is **never
committed**; only derived metadata, headings and short citations are.

## Build

```bash
npm run books:build
```

Deterministic `tools/books/build_corpus.py` produces:

| artifact | committed? | purpose |
|---|---|---|
| `books-clean/<slug>.txt` | no | normalized text; 1:1 line mapping |
| `books-index/books.json` | yes | title/author, counts, checksum, review flag |
| `books-index/quality.json` | yes | extraction diagnostics |
| `books-index/chunks.jsonl` | no | 120-line AI chunks (12-line overlap) |
| `books-index/index.sqlite` | no | SQLite FTS5 search |
| `books-index/INDEX.md` | yes | human/AI heading index with exact line ranges |
| `books-index/parts.json` | yes | 6000-line audit work units for subagents |
| `books-index/agent-parts/*.json` | yes | subagent headings/problems/summaries |
| `books-index/agent-audit.json` | yes | validated merge of the audit |

**Coverage guarantee:** normalization never adds/drops lines. Every source
line maps to exactly one clean line; line endings/BOM/Unicode spaces/control
characters are normalized, tabs become spaces, trailing whitespace is stripped.
It does **not** rewrite prose or silently "fix" typos. `quality.json` flags
replacement characters, control characters, long lines, repeated page
headers/footers and hyphenated line endings for review. A clean extraction is
not a guarantee that the publisher's prose has no typos; that requires an
authoritative edition.

## Read/search (what an AI should use)

```bash
npm run books:stats
npm run books:search -- "text object"
npm run books:search -- "registers" --book practical-vim
npm run books:read -- practical-vim 1200 1240
npm run books:toc -- practical-vim
```

`books:search` returns exact `book:start-end` citations; `books:read` prints
the exact numbered lines. This is deliberately cheaper and more accurate than
pasting whole books into a model prompt. Use FTS terms (AND semantics); the
reader falls back to a literal search if the FTS query is malformed.

## Subagent audit

`books-index/parts.json` splits every book into ~6000-line units. Each audit
agent reads only its exact line range, emits headings with **exact evidence
lines**, and flags extraction defects (`missing`, `duplicated`, `garbled`,
`order`, `truncated`) with exact line numbers. It must write its JSON to
`books-index/agent-parts/<id>.json`; it must not rewrite prose.

`tools/books/merge_audit.py` validates every cited line against the clean text
and rejects a heading/problem whose evidence does not match. Run the audit
through the workflow tool (19 parts at current book sizes); then merge and
regenerate `INDEX.md`/`agent-audit.json`.

## Source-completeness warning

Line coverage proves that the extractor kept every line it was given; it does
**not** prove the source file is the complete book. The builder also checks
numbered chapter labels for gaps:

- **`neovim-for-beginners` is partial**: it starts at `c0`, jumps to `c119`, and
  has large label gaps. Do not use it as a complete syllabus until a complete
  source is supplied. The audit flags exact missing/order evidence.
- Other books show no numbered-chapter gap, but publisher ToCs must still be
  checked; the subagent audit is a triage, not a publisher proof.

The requirement "no missing book content" can only be met with complete
authoritative source files. The pipeline refuses to invent the missing text.

## Quality policy

- No silent spelling corrections: technical Vim terms and code would be damaged.
- No chunk gaps: chunks overlap but their union covers every line.
- Agent headings are candidates; publisher ToCs remain authoritative.
- Full text/book chunks/sqlite are local-only; do not commit them.
