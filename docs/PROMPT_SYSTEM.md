# PROMPT SYSTEM — how an AI is allowed to work on VIMLORE

> This file is the **contract for every AI session** on this repository. The
> literal per-session brief is [`NEXT_PROMPT.md`](NEXT_PROMPT.md); this file is
> the reusable protocol behind it. If a prompt conflicts with this file, this
> file wins; if either conflicts with real `vim -u NONE`, real Vim wins.
>
> The goal is not “more instructions”. It is **fewer opportunities for a
> plausible-sounding mistake**: context, evidence, invariants and handoff are
> standardized so the next agent cannot silently drift.

## 1. Essence first

VIMLORE is a **Vim teaching terminal** with three promises:

1. **Fidelity** — the engine behaves like real Vim, not like a lookalike.
2. **Curriculum** — the path is derived from the ten professional Vim books and
   is gradual, prerequisite-correct and repetitive enough to become muscle
   memory, not trivia.
3. **Craft** — the play space, cursor, UI and handoff are deliberate; the game
   must stay fast, keyboard-only and honest about what it does not support.

A task is done only when it strengthens one of these without weakening another.

## 2. Context hierarchy

Read in this order; earlier wins on conflicts:

1. **Real Vim** (`vim -u NONE`) — executable truth.
2. [`MASTER_PLAN.md`](MASTER_PLAN.md) — priorities and task board.
3. [`AGENTS.md`](../AGENTS.md) — invariants, design laws, shipping rules.
4. [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md) — curriculum authority.
5. [`VIM_COVERAGE.md`](VIM_COVERAGE.md) — honest engine boundary.
6. [`HANDOFF.md`](HANDOFF.md) — current state, known gaps, traps.
7. [`ARCHITECTURE.md`](ARCHITECTURE.md) — layers and bug-resistant rings.
8. Prose, commit messages, old plans — lowest; never evidence by themselves.

## 3. Non-negotiables

- Never “fix” a level by weakening Vim semantics. Add an oracle case first.
- Never commit a red gate. Revert an experiment that breaks the oracle instead
  of hiding the failing case.
- Never add a stage/chapter in this program; stage count is elastic only after
  the curriculum program is explicitly opened.
- Never invent a curriculum lesson. Cite a book section and a prerequisite; see
  `CURRICULUM_PROVENANCE.md`.
- Never add a server, account, tracking, runtime dependency, secret or
  filesystem assumption. One static page.
- Never claim “fixed/passing/fast” without a command and its result in the
  session. If you did not run it, say so.
- Keep the engine pure: `src/core/vim/` must not import UI/game/browser code.

## 4. The task packet

Every task handed to an AI must be expressible as this packet. If a field is
missing, the agent must ask or state an explicit assumption before editing.

```text
ROLE:        engine | UI | curriculum | release | audit
OBJECTIVE:   one measurable sentence
CONTEXT:     files/docs to read, and why
EVIDENCE:    commands to run before and after (with expected values)
SCOPE:       files allowed to change
NON-GOALS:   what must not change (e.g. stage par, renderer architecture)
ACCEPTANCE:  exact commands + thresholds; red-line conditions
RISK:        what could regress; rollback plan
HANDOFF:     files to update, commit/push/Pages obligations
```

`NEXT_PROMPT.md` is an instance of this packet. New prompts should copy its
shape, not invent a new one.

## 5. Execution protocol

### Before editing

1. `git status` and `git log --oneline -5`; inspect, do not assume.
2. Run the preflight gates (see §6).
3. Read the relevant layer and write a one-paragraph hypothesis. For an engine
   bug: reproduce it with a minimal oracle/fuzz case **before** changing code.
4. Check whether the work belongs to the current program. Buffers/files/
   windows/tabs are deferred (`FUTURE_EDITOR.md`); do not fake them.

### While editing

- One workstream at a time. If two changes touch the same file, finish one.
- Prefer the smallest change that satisfies the acceptance evidence.
- Keep state invariants explicit. New engine state must be checked by
  `Vim.checkInvariants()` / `strict: true` or by an equivalent test.
- Do not add a second source of truth. If a count, command or coverage fact is
  derived, generate or check it; do not hand-copy it into three docs.
- Keep the renderer's hot path allocation-light and the engine pure.

### After editing

Run the full postflight and paste the real output into the handoff. If a gate
fails: stop, fix or revert; do not commit a “mostly green” state.

## 6. Gates and evidence

Preflight / postflight (as applicable):

```bash
npm run doctor
npm test
npm run lint:levels
npx tsc --noEmit
npm run doc-check
npm run invariants
npm run build
npm run budget
node --experimental-strip-types tools/oracle-diff.ts    # 367/367
node --experimental-strip-types tools/fuzz.ts --n=1000 --seed=7
cd /home/jung/ai_station/sandbox && node pw/audit.mjs
node pw/perf_local.mjs
```

`npm run verify` is the fast gate bundle; `npm run verify:full` adds the oracle
and a fuzz seed. The oracle is the highest authority; see
[`ARCHITECTURE.md`](ARCHITECTURE.md) for the full bug-resistant rings.

## 7. Definition of done

A task is done only when all are true:

- the acceptance command(s) pass, with output recorded;
- oracle count is unchanged or higher, never lower;
- 51/51 stages still lint, and no stage solution/par was silently altered;
- `tsc`, `doc-check`, `invariants`, build are green;
- the browser audit has no page errors and the affected flow works keyboard-only;
- docs/counts/perf numbers are updated in the same commit;
- `git status` is clean, HEAD is pushed, Pages succeeds, live asset hash checked;
- `HANDOFF.md` states what was verified **and what was not**.

## 8. Handoff schema

Every handoff answers the same fields; prose is not a substitute.

```text
HEAD:            <short sha> (<date>)
CI / Pages:      <run conclusions + live asset hash>
GATES:           oracle N/N · tests N · lint N/N · tsc · doc-check · invariants
BUILD:           single-file bytes · gzip bytes
PERF:            desktop x1/x4 · phone · method · known environment limits
CHANGED:         files with one-line reason
DECISIONS:       architecture choices and rejected alternatives
OPEN BUGS:       repro + expected/actual, or “none known”
NEXT 3:          ordered, each with acceptance evidence
NOT VERIFIED:    explicit list
```

`HANDOFF.md` holds the current instance. `MASTER_PLAN.md` holds priorities;
`NEXT_PROMPT.md` holds the next session’s task packet.

## 9. Prompt templates

### Engine bug

```text
Reproduce with the smallest oracle/fuzz case. Fix the engine (not the level).
Add the case to tools/cases.ts, emit the snapshot, run oracle + tests + fuzz
(seed 7/11/23/31/47/101). Strict invariants are on: never suppress a violation.
If three adjacent cases regress, revert and rethink; do not special-case prose.
```

### Advanced Vim feature

```text
Check VIM_COVERAGE and real vim. Add oracle cases first (or a unit test if the
interactive nature cannot be automated, e.g. :s///c), then implement, then
document the honest boundary. No fake state: if buffers/windows are required,
it is the deferred editor program, not this task.
```

### Curriculum

```text
Read CURRICULUM_PROVENANCE.md and the relevant book sections. Record source →
concept → prerequisite → exercise → review before writing a level. The path must
be gradual and repetitive enough for embodiment; repetition must vary text,
cursor position, count, operator, nest and medium — not repeat one sentence.
“Plausible” is not “derived”. Do not add stages in this program.
```

### UI / performance

```text
Measure before/after with pw/perf_local.mjs and a screenshot. Preserve the
one-blit composite frame and text sharpness. Never trade correctness for a
headless number; document environment limits. Keyboard-only audit is mandatory.
```

### Release / handoff

```text
Run all gates, build, commit, push, confirm CI + Pages, check the live asset
hash, scrub the remote URL, update HANDOFF/MASTER_PLAN. If anything is not
verified, write it under NOT VERIFIED rather than implying success.
```

## 10. Anti-patterns (do not do these)

- “The plan says X is done” → run the gate; old prose is not evidence.
- “I fixed a similar case” → this engine has edge cases; reproduce this one.
- “The test is flaky” → inspect; a real oracle divergence is not flakiness.
- “I’ll update docs later” → doc drift is a bug; update in the same commit.
- “I’ll add a buffer command quickly” → it needs the Editor model; see
  `FUTURE_EDITOR.md`.
- “More stages will make it feel complete” → the curriculum is book-derived and
  the engine is the product; no plausible filler.
- “60fps in headless” → measure the environment; the headless ceiling is
  documented in `HANDOFF.md`.
- “The human asked for everything” → scope the task packet and state non-goals.
