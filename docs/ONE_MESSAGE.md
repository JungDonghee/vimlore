# ONE-MESSAGE KICKOFF — paste this into another AI

> This is the shortest self-contained message that starts an autonomous
> VIMLORE session. It assumes the AI has filesystem + shell access to the host
> checkout. It does **not** contain the GitHub token; the token stays outside
> the repo.
>
> For the full task packet and scorecard, read [`NEXT_PROMPT.md`](NEXT_PROMPT.md)
> and [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md).

---

```text
You are taking over KIRITSU (VIMLORE is the world/series), a Vim-teaching terminal at
/home/jung/ai_station/sandbox/vimlore (GitHub JungDonghee/kiritsu, live
https://jungdonghee.github.io/kiritsu/).

Work autonomously until you have a safe, verified stopping point. Do not ask me
to choose between routine implementation options; only stop and report if a
hard blocker (missing repo/tool access, missing token, or a gate you cannot
make green) actually prevents progress.

FIRST, before editing:
1. Read docs/PROMPT_SYSTEM.md, docs/NEXT_PROMPT.md, docs/HANDOFF.md,
   docs/CURRICULUM_PROVENANCE.md, docs/BOOKS_INDEX.md, docs/STAGE_PROVENANCE.md.
2. Run: git status && git log --oneline -5
   npm run doctor
   npm test
   npm run lint:levels
   npx tsc --noEmit
   npm run doc-check
   npm run invariants
   npm run build
   npm run budget
   node --experimental-strip-types tools/oracle-diff.ts
3. Trust the gate output, not this message. If the checkout differs from
   HEAD 20a1c3a, re-baseline before trusting old numbers.

NON-NEGOTIABLE:
- Real vim -u NONE is the only oracle. Add an oracle case before changing Vim
  semantics; never change a level to fit a bug.
- Do not add stages or chapters. The existing 51 stages are frozen.
- Do not fake buffers/files/windows/tabs on the single Vim.buf; that program is
  deferred (docs/FUTURE_EDITOR.md).
- The ten books in books-text/ are the syllabus; never invent a plausible
  lesson or a citation. Stage provenance is currently 5/51 cited.
- Keep the game keyboard-only, zero-runtime-dependency, no server, no secrets.
- Never print or commit the token at ../.secrets/github_token. After a push,
  the remote must be scrubbed to the clean GitHub URL.
- Never commit red gates. If a broad change breaks unrelated oracle cases,
  revert and rethink (this has happened repeatedly).

PRIORITY (full detail in docs/NEXT_PROMPT.md §4):
1. Cursor-only fuzz: 14 edges across seeds 31/101/211. Reproduce each with a
   narrow oracle case, fix, emit the snapshot, then run all nine seeds. Do not
   generalize a cursor rule across motions.
2. Invariants: 15 coverage warnings. Fix metadata or write an explicit
   acknowledged-debt list; do not hide warnings.
3. Curriculum provenance: 46/51 stages unmapped. Use docs/BOOKS_INDEX.md,
   read the section, add Stage.sources, regenerate STAGE_PROVENANCE.md.
4. Real-GPU 60 fps: measure x1/x4 and phone; headless is capped ~54–57. If the
   hardware is unavailable, write NOT VERIFIED.
5. Bundle: 256,181 B / 81,640 B gzip vs 258,000/82,000 ceiling; reduce before
   adding large features.
6. Only then consider g;/g, or the deferred editor Phase A.

DEFINITION OF DONE:
oracle N/N · tests · lint 51 · tsc · doc-check · invariants 0 errors · build ·
budget PASS · affected fuzz seeds clean · keyboard/browser audit if UI changed ·
docs and HANDOFF updated in the same commit · git tree clean · pushed · CI and
Pages green · live asset hash checked.

REPORT AT THE END:
HEAD, CI/Pages, oracle/tests/lint/invariants, fuzz seeds + divergences, build
bytes + gzip, perf before/after with hardware, files changed, bugs fixed, open
repros, NOT VERIFIED list, and the next three tasks.
```

---

## How to use it

1. Open the host checkout on the machine where the next AI runs.
2. Paste the block above as the entire first message.
3. If the next AI cannot access the path, give it the repository instead:
   <https://github.com/JungDonghee/kiritsu> — it still needs the books for
   curriculum work, and the token only for pushing.
4. If you want a freshly generated message (current HEAD + date), run
   `npm run kickoff` and copy its output.

The message is deliberately explicit about **not trusting prose** and **not
starting a second workstream**. That is what makes one message enough to start;
it is not a guarantee that a remote chat service will run unattended for hours.
