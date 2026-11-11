# Differential debugging

When `oracle`, `matrix` or `state-matrix` reports a mismatch, find where the
divergence is **born** instead of staring at the final state.

## Prefix trace

```bash
npm run trace -- --case=m-5728
npm run trace -- --case=m-5728 --all
npm run trace -- --text="foo bar" --cursor=1,2 --keys="d2w"
```

`trace` runs the sequence through real Vim and the engine, capturing buffer,
cursor, unnamed register and register type after **every token prefix**. The
first prefix with a different observable state is printed.

Example (`c)` on a blank-separated buffer):

```
prefix 1 "c"  ok
FIRST DIVERGENCE at prefix 2 "c)" fields=reg,regtype
  vim {"reg":"a\n","cursor":[1,0],"lines":["","","b","","c"],"regtype":"linewise"}
  eng {"lines":["","","b","","c"],"cursor":["..."] ,"reg":"a","regtype":"charwise"}
```

That immediately says the bug is in the **linewise conversion of a sentence
change**, not in the insert or undo tail.

`--case` uses the same generated cases as `state-matrix`/`matrix`; otherwise
pass `--text`, optional `--cursor=line,col`, and `--keys`.

## What it does not cover yet

- Mode is not compared (`vim -es` reports `c` for `mode()`); the state matrix
  documents this limitation.
- The per-prefix trace compares buffer/cursor/register, not the state after
  `u`. Use `state-matrix` for final undo divergences.
- A shrinker is not built yet: once the first divergent prefix is known, trim
  keys/text by hand or with a future `tools/shrink.ts`.

The tool is local-only; it never enters the runtime bundle.
