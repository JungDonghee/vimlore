# KIRITSU — new session handoff (2026-11-14)

## Read first

1. `AGENTS.md`
2. `docs/STORY_BIBLE.md`
3. `docs/story/KIRITSU_LOGIC.md`
4. `docs/story/PROLOGUE.md`
5. `docs/AUTOMATION_LOG.md`
6. `docs/STATUS.md`
7. `docs/DESIGN.md`
8. `README.md`

## Locked state

- Repository: `/home/jung/ai_station/sandbox/vimlore`
- Latest automation commit: `36744cd`
- Live: https://jungdonghee.github.io/vimlore/
- Design is **locked**: kanji-first `規律`, `CALL kiritsu` code strip, no Russian
  lettering, no sakura branch, laser reveal, centered VIMLORE layout.
- Do not redesign the title. Do not touch campaign first-clear solutions, par,
  gates, or level solutions.
- Engine baseline: 104 full-editor state-matrix edges open; game-used
  solution+undo is 51 of 51. This is documented debt, not a game blocker.
- Story/LIVE/puzzle implementation was deliberately not started.

## Today's job

Story only. Start with a short decision pass, then one vertical slice.

Decisions to confirm with the user before writing canon:

1. What is the player's relationship to Cursor 07 — replacement, copy, or
   witness?
2. Does the Registrar know the loop count, or only ORACLE?
3. What does Kuro want that is not "revenge"?
4. Which of the four endings is the first-play default, and which requires
   knowledge from a previous loop?
5. Does RIN exist outside the terminal, or only as a maintenance process?
6. Is the final self-closure a mercy, a sentence, or a bureaucratic procedure?

Deliverable after decisions:

- one c01 vertical slice: title → prologue beat → first Vim task → diegetic
  consequence → save/persistence;
- no new engine commands unless a story beat requires them;
- no LIVE or puzzle redesign yet;
- Korean UI copy plain/banmal only.

## Rules

- Run `npm run korean:check`, `doc-check`, tests, `status:check` before commit.
- Commit/push only when green.
- Do not claim the 104 state edges are zero.
- Do not restore Russian or the branch.
- Keep the page installable/offline and the single-file build self-contained.

## Suggested first message for the new session

> KIRITSU 스토리 작업 시작. 먼저 AGENTS.md, docs/STORY_BIBLE.md,
> docs/story/KIRITSU_LOGIC.md, docs/story/PROLOGUE.md,
> docs/AUTOMATION_LOG.md, docs/DESIGN.md를 읽어라. 디자인과 엔진은 동결됐고
> 캠페인/스토리 캐논은 네가 임의로 바꾸지 마라. 오늘은 스토리 결정 6개를
> 나랑 확정한 뒤 c01 수직 슬라이스 하나만 구현한다. 한국어는 반말로.
