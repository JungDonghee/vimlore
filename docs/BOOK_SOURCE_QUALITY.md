# Book source quality report

Generated from `books-index/quality.json`, `coverage.json`, `agent-audit.json`
and `spellcheck.json`. This is a **triage report, not a correction log**.

## Hard numbers

- 10 books, **78,502 source lines**
- clean text line mapping: **78,502 / 78,502** (1:1, no dropped lines)
- chunk coverage: **78,502 / 78,502**
- audit-part coverage: **78,502 / 78,502** (19 parts)
- evidence-validated subagent headings: **2,554**
- extraction defects flagged: **129** — 92 garbled, 18 missing, 12 duplicated,
  5 order, 2 truncation
- subagent evidence mismatches rejected: **0** (the merge checks every cited
  line against the clean text)
- partial source: **`neovim-for-beginners`** (chapter-label gaps: c0→c9→…→c119;
  only the later material is present)

## What is guaranteed

- No line was silently dropped by normalization; BOM/CRLF/Unicode-space/control
  normalization is recorded.
- Chunks and audit parts cover every clean line.
- Every committed audit heading/problem cites an exact line that was verified.

## Priority two-book audit

Practical Vim + Modern Vim had a second, chapter-level audit (28 agents):
417 command citations, 336 concepts, 175 defect candidates, **0 rejected
evidence mismatches**. The deeper pass found 56 typo candidates and formatting
defects that the coarse 19-part audit missed. Neither book has a numbered-
chapter gap, but the source still contains flattened tables, glued tip headings
and typographic quotes in code. See `books-index/priority/ERRATA.md`. Nothing
was silently corrected.

## What is not guaranteed

- The source files are not publisher-authoritative scans/editions. The audit
  found 129 extraction defects, and `neovim-for-beginners` is materially
  incomplete. These cannot be repaired without a complete, authoritative source.
- **Typo-free prose cannot be claimed.** `books-index/spellcheck.json` contains
  hunspell candidates (technical terms are heavily over-represented); it is a
  review queue, not an autocorrect list. The pipeline never changes book prose.
- A heading is a candidate, not a publisher ToC entry.

## Spellcheck candidate counts

| book | candidates | book | candidates |
|---|---:|---|---:|
| 5 Years of Vim | 228 | Gourmet Vim | 424 |
| Learning vi/Vim | 4,037 | Modern Vim | 1,780 |
| Neovim for Beginners | 500 | Practical Vim | 1,900 |
| Pro Vim | 2,802 | Use Vim Like A Pro | 174 |
| Vim 101 Hacks | 524 | Vim Reference Guide | 771 |

To meet "no missing content" for all ten books, supply complete source editions
for at least the flagged files. Do not let an AI fill gaps from memory.
