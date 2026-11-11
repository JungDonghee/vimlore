# NEXT PROMPT — copy this to the next AI

> This is the literal brief for the AI that continues VIMLORE. It is intentionally
> short: the source of truth is [`MASTER_PLAN.md`](MASTER_PLAN.md). If this file and
> the plan disagree, the plan wins; if either disagrees with real `vim -u NONE`,
> real Vim wins.

---

You are the next orchestration AI for **VIMLORE**, a Vim-teaching game at
`/home/jung/ai_station/sandbox/vimlore` (GitHub `JungDonghee/vimlore`, live at
<https://jungdonghee.github.io/vimlore/>).

**Mission, in priority order** (the human's standing directive):

1. Fix engine bugs; real Vim is the only oracle.
2. Extend the engine toward advanced, transferable Vim — not IDE plumbing.
3. Keep the game at 60 fps on desktop and smooth on a cheap phone.
4. Make the play screen feel like a crafted Vim/Neovim window (cursor, space,
   chrome) and state every stage's **LEARN / GOAL / PAR** explicitly.
5. Do **not** add stages or chapters in this program. Stage count is elastic;
   the engine is the product.
6. Leave the project greener than you found it: gates green, docs current,
   commit pushed, Pages deployed.

**First 30 minutes — do not skip:**

```bash
cd /home/jung/ai_station/sandbox/vimlore
git status && git log --oneline -5
npm run doctor
npm test
npm run lint:levels
npx tsc --noEmit
npm run doc-check
node --experimental-strip-types tools/oracle-diff.ts
```

Read: [`MASTER_PLAN.md`](MASTER_PLAN.md) (§0–§7) → [`AGENTS.md`](../AGENTS.md) →
[`HANDOFF.md`](HANDOFF.md) → [`ARCHITECTURE.md`](ARCHITECTURE.md) →
[`VIM_COVERAGE.md`](VIM_COVERAGE.md).

**How to work**

- Pick tasks from the board in `MASTER_PLAN.md` §6. Change the status to
  `in progress` in the same commit as the work.
- Engine work: add the oracle case first (`tools/cases.ts`), confirm it fails,
  fix `src/core/vim/`, confirm it passes, `--emit` the snapshot, then all gates.
  Never change Vim semantics to make a level pass.
- UI work: one owner for `src/ui/render.ts` at a time. Measure with
  `pw/perf_local.mjs`; screenshot desktop 1280×800 and phone 844×390; zero
  console errors.
- Fuzz: `node --experimental-strip-types tools/fuzz.ts --n=1500 --seed=7`.
  A fuzz divergence is a bug unless it is an intentionally unsupported feature;
  never silence it by weakening the generator.
- No secrets in the repo. The deploy token is at
  `/home/jung/ai_station/sandbox/.secrets/github_token`; never print it, never
  commit it, and scrub the remote URL after every push.

**Definition of done for a session**

- Oracle N/N, `npm test`, `npm run lint:levels`, `tsc`, `doc-check` all green.
- `npm run build` succeeds; the single-file build still opens.
- Playwright audit: gating + stage 1 + zero page errors.
- If UI/perf changed: before/after fps numbers and screenshots.
- `MASTER_PLAN.md` §2 snapshot and §6 board updated.
- `HANDOFF.md` says what was verified and what was **not**.
- Commit, push, scrub the remote, confirm the `pages` workflow succeeds.

**Report template**

```
DONE:    <task ids>
GATES:   oracle N/N · unit tests 23 · lint 51 stages · tsc 0 · doc-check OK · build OK
PERF:    desktop x1 __ fps (before __) · phone x4 __ fps (before __)
UI:      screenshots <paths> · audit <result>
FIXED:   <bugs + oracle case names>
LEFT:    <task ids + exact blocker>
NOTES:   <surprises, decisions, next step>
```

**Current state** (update this from `MASTER_PLAN.md` §2, never trust this copy):
slice 1 + Tier 1 + the fuzz-fix pass are landed: oracle 233/233, 51 stages, 84
commands, desktop 53–56 fps, live and deployed. `gn`/`g*`/`g#` shipped; slice 2
starts with the remaining fuzz edges, `g;`/`g,`, `:s///c`, and curriculum
metadata. The board is authoritative.
