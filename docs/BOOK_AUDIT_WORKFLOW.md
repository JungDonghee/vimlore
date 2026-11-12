# Book audit workflow (subagents)

This is the automation contract for auditing the ten Vim books without
hallucinating content. It runs **same-model subagents** in waves (the active
child limit is 8 here); each agent reads only its assigned 6000 lines.

## Inputs

- `books-index/parts.json`: 19 units, each `{id, book, start, end, sha256}`.
- `books-clean/<slug>.txt`: local full text (gitignored).
- Output: `books-index/agent-parts/<id>.json`.

## Rules for each agent

- Read **only** the assigned 1-based line range (`sed -n 'start,endp'` in
  ~1000-line chunks).
- Never use memory of the book, never rewrite prose.
- Heading: `line`, exact `title`, exact `evidence` line. Omit if uncertain.
- Problem kinds only: `missing`, `duplicated`, `garbled`, `order`, `truncation`;
  exact evidence line.
- Summary is explicitly a summary (1–2 sentences); concepts are short tags.
- Write the JSON file; final response only `{id, ok, note}`.
- Do not edit other files.

JSON shape:

```json
{"id":"book-audit-01","book":"slug","start":1,"end":6000,
 "headings":[{"line":1,"title":"...","evidence":"..."}],
 "problems":[{"line":1,"kind":"garbled","evidence":"..."}],
 "summary":"...","concepts":["..."]}
```

## Waves

Run at most **8** agents at once, with 6000-line parts, sequentially in waves.
A workflow script should construct parts from `books-index/parts.json` (or the
same 6000-line rule), call `agent()` with the schema and prompt above, and
write outputs to `books-index/agent-parts/`.

## Validation / merge

```bash
npm run books:merge
```

`tools/books/merge_audit.py` rejects any heading/problem whose evidence does
not exactly match the cited clean line; duplicates across overlapping units are
deduped. `books:audit` data is never accepted as book text or as publisher
proof.

## After merge

- Regenerate `docs/STATUS.md` (`npm run status:write`).
- Regenerate `docs/BOOKS_PIPELINE.md`/`INDEX.md` if headings changed.
- Commit `books-index/agent-parts/`, `agent-audit.json` and metadata; never
  commit `books-clean/`, `chunks.jsonl`, or `index.sqlite`.
