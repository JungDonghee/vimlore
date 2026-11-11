# HANDOFF — VIMLORE 완성 작업 인계서

> **이 문서를 읽는 새 AI(또는 사람)에게:** 이 파일이 현재 작업의 유일한 진실(Source of Truth)입니다.
> 프로젝트 불변식은 [`AGENTS.md`](../AGENTS.md)에, 아키텍처는 [`ARCHITECTURE.md`](ARCHITECTURE.md)에,
> 그리고 **코드의 규모·복잡성·리스크와 완성 전략은 [`EVALUATION.md`](EVALUATION.md)에** 있습니다.
> 여기서부터 시작하고, `npm run doctor`를 먼저 실행하세요.

마지막 갱신: 2026-11-10

---

## 0. 한눈에 보는 상태

| 영역 | 상태 |
|---|---|
| 엔진 ↔ 실제 Vim 정합성 (oracle) | **142/142 통과** (엔진 med/low 수정 중, 아래 참고) |
| 레벨 무결성 (lint:levels) | **51/51 통과** |
| 단위 테스트 (npm test) | **23/23 통과** |
| 타입체크 (tsc) | 통과 |
| 스킬 해금 게이팅 | **우회 전면 봉쇄 완료** |
| UI 키보드 조작 | **전 화면 h/j/k/l + Enter 완료** |
| 성능 | layerKey O(1) + bloom 저해상도 적용됨, **재측정 필요** |
| 문서 정합성 | doc-check CI 게이트 구축됨 |

**git**: branch `main`, 원격 `github.com/JungDonghee/vimlore`. 최근 커밋 `d88e1e7` 기준에서
엔진 med/low 수정이 진행 중(아직 커밋 안 됨)일 수 있다. **가장 먼저 `git status`로 작업 트리를 확인하라.**

---

## 1. 이번 세션에서 이미 완료된 것 (재작업 금지)

### 1-1. 스킬 해금 게이팅 우회 전면 봉쇄 (사용자 최우선 요구)
`src/core/game/session.ts` + `src/core/vim/engine.ts` + `src/content/*`
- 잠긴 스킬을 `:normal`·매크로(`@`)·dot-repeat(`.`)로 우회하던 경로를 `Vim.gate` 훅으로 차단.
- operator-pending 둘째 키, 텍스트 오브젝트(`di"`→4장, `d%`→8장), 두 글자 g 명령(`gU`→10장)을 **조합 단위**로 게이트.
- `D`/`C` 영구잠금 해제(c03.unlocks에 추가), `gJ`를 5장 그리모어로 이동, `i{`/`a{`/`g~` 그리모어 추가.
- 텍스트 오브젝트·g 조합을 `unlocks`에 "조합 문자열"로 나열(c04/c05/c10).
- TRIALS의 `allowAll()`이 두 글자 조합을 포함하도록 보강.

**핵심 규칙**: 게이팅은 `Session.keyAllowed()` 하나에서 결정되고, `Vim.gate`가 그걸 모든
입력 경로(`:normal`, 재생)에 적용한다. 이 구조를 깨지 말 것.

### 1-2. UI 키보드 네비게이션 (사용자 직접 지적)
`src/ui/dom.ts`(`focusGroup`/`focusStep`/`focusActivate`) + `src/ui/play.ts` + `src/ui/app.ts`
- 결과 화면(NEXT/RETRY/CHAPTER)·인트로·패배·설정 화면의 버튼을 **h/j/k/l + Enter**로 이동·선택.
- trials 화면에 `g/G`·`Ctrl-d/u`·`PageUp/Down`·`Home/End` 추가.

### 1-3. 엔진 버그 (oracle 케이스 117 → 126)
- exclusive `w` 폴백, count 붙은 `$` linewise, `G` count, 닫는 괄호 위 `di(`/`di{`,
  빈 태그/괄호 no-op, insert `<CR>` 커서 위치, `guu`/`gUU` doubled.
- **jumplist**: oracle의 공유 vim 프로세스가 jump list를 오염시켜 신뢰할 수 없음 → oracle에서 제외.
  엔진 jumplist는 단일 vim 프로세스 수동 비교로 기본 동작 확인됨. (아래 §4 함정 참고)

### 1-4. UI 버그 + 성능
- lineNumbers `rel`→`both` 오류, F2 재시작 시 gutter 소실, 장식 `~`가 hazard로 그려지던 문제,
  sound 설정을 `progress.sound`로 통합(세이브 내보내기 포함), playGhost destroy 후 유출.
- 렌더러: glyph layer key를 버퍼 `version` 기반 O(1)로, bloom을 반 해상도로.

---

## 2. 남은 작업 (우선순위 순)

> 엔진 med/low 수정 subagent가 작업 중일 수 있다. **먼저 `git status`와 oracle 결과를 확인**하고,
> 아래 목록에서 이미 처리된 항목은 건너뛰어라.

### P0 — 진행 중인 엔진 수정 마무리 (만약 subagent가 끝냈다면 검증만)
- **H7 visual-block `d`/`y`/`p`**: `engine.ts`의 `deleteRange`/`yankRange`가 `r.block`을 무시.
  각 줄의 `[c1,c2]` 컬럼만 삭제/복사해야 함. 재현 `<C-v>ljd` on "abcd\nefgh" → vim ["cd","gh"].
- **M10~M20, L21~L23** 목록은 §3 "버그 카탈로그"에 상세 기술.

### P1 — 성능 (미해결, 근본 원인 파악됨)
`layerKey` O(1) + bloom 반해상도를 적용했지만 **desktop은 여전히 22fps** (재측정 완료).
- 측정: desktop 1280×800 = 22fps(avg ~44ms), phone 844×390 = 59fps.
- 근본 원인: `render()`가 매 프레임 **layer + bloom 전체 캔버스를 blit**하고, 이 비용이
  픽셀 수(desktop dpr2 = 2560×1600 ≈ 4.1M)에 비례. bloom 반해상도로는 해결 안 됨.
- 해결 방향(우선순위): (1) 큰 화면(폭>1000px)에서 `crt` 효과(bloom/scanlines)를 자동
  경량화/off하는 분기, (2) bloom/scanlines를 CSS(배경/마스크, GPU)로 이전, (3) 글리프
  layer를 DOM `<img>`/배경으로 옮기고 FX만 캔버스로. `body.crt-off`는 이미 모든 효과를
  끈다(끈 상태로 60fps가 나오는지부터 확인하라).

### P2 — 실제 플레이 회귀 테스트 (반드시)
수정 후 **로컬 빌드를 다시 만들고** 브라우저로 확인:
```bash
cd vimlore && npm run build          # dist/ + dist/vimlore.html
cd /home/jung/ai_station/sandbox && node pw/audit.mjs   # 게이팅 + 스테이지1 플레이
```
`pw/audit.mjs`는 게이팅(미해금 키 16개 잠김 / 허용 키 11개 동작)과 스테이지1 3별 클리어를 검증한다.
페이지 에러/콘솔 에러 0이어야 한다.

### P3 — 커리큘럼 정합성 (낮은 우선순위, 의심 사항)
- c02s5 "The Broken Sign"이 `t` vs `f`를 가르친다고 했지만 solution이 `f/;`만 사용 → `t` 미실습.
- c01/c02 `unlocks`에 실제 스테이지에서 연습 안 하는 스킬(`X`,`I`,`o`,`O`,`F`,`T`,`B`,`,` 등) 포함.
- `docs/CURRICULUM.md` 스테이지 이름 일부 stale.
- `docs/LEVELS.md`는 `tools/gen-docs.ts`로 자동 재생성(직접 편집 금지).

### P4 — 나머지 UI 정리
- `progress.ghost` 필드가 여전히 데드(어디서도 안 읽음). F3 고스트는 `hintLevel`로 제어.
  설정 화면에 ghost 토글을 추가하거나 필드를 제거하라.

---

## 3. 엔진 버그 카탈로그 (각 항목: 증상 → 재현 → 수정 방향)

모두 **실제 `vim -u NONE`과 diff로 확정된 것**. oracle 케이스는 `tools/cases.ts`에 추가한 뒤
`node --experimental-strip-types tools/oracle-diff.ts`로 실패를 확인하고 수정하라.

### High
- **H7 visual-block d/y/p** — `engine.ts` `deleteRange`(984)/`yankRange`(1026)가 `r.block` 무시.
  `<C-v>ljd` on "abcd\nefgh" → vim ["cd","gh"] / engine ["gh"]. 각 줄 `[c1,c2]`만 처리.

### Medium
- **M10** `motionFor`(engine.ts)에 operator-pending `+ - _ |` 누락. `d2+`/`d2|`.
- **M11** `motionFor`의 `l`/`<Space>`가 dest를 `lineEnd`로 clamp → `yl`/`dl` 빈 range.
  exclusive endpoint는 `col+count` 허용.
- **M12** `objects.ts` `aw`/`aW`가 공백 위에서 다음 단어 미포함. `daw` on "foo   bar" 공백 커서.
- **M13** `objects.ts` `a"`/`a'`/`a\`` around이 trailing 공백 1자만 소비(전체 run이어야).
- **M14** `objects.ts` `quoteObject`가 인용부호 (i,i+1) 고정 쌍만 매칭 → `di"` on `say ""x""` 커서 'x'.
- **M15** `objects.ts` `paragraphObject` 공백 줄에서 null → `dip`/`dap` 공백 줄 no-op.
- **M16** `search.ts` `\c`/`\C`를 패턴 시작에서만 인식(Vim은 어디든). `/foo\C<CR>`.
- **M17** `ex.ts`/`engine.ts` `:m0`/`:t0` dest=0 off-by-one.
- **M18** `motions.ts` `}`/`{` count>1 범위 오류. `d2}` on "a\nb\n\nc\nd".
- **M19** `engine.ts` charwise/linewise visual `I`/`A`가 선택 무시. `vlIX<Esc>` on "abc" → vim "Xabc".
- **M20** `engine.ts` `` `` ``(backtick-backtick)와 `''`(이전 점프 복귀) 미구현.

### Low
- **L21** block `A` 종료 커서 1칸 오른쪽.
- **L22** `:g/pat/p`/`:g/pat/s/.../` 커서가 마지막 처리 줄로 이동 안 함.
- **L23** `:m` 종료 커서 일부 1줄 오차.

---

## 4. 함정과 주의사항 (실수 방지 — 반드시 읽을 것)

1. **jumplist는 oracle로 검증하지 마라.** oracle-diff가 모든 케이스를 하나의 vim 프로세스에서
   순차 실행하는데, jump list가 케이스 간에 누수된다(`clearjumps`로도 불완전). `<C-o>`/`<C-i>`
   케이스를 `cases.ts`에 넣지 말 것. jumplist는 1케이스=1프로세스로 수동 검증.
2. **엔진 수정은 항상 oracle 케이스를 먼저 추가하고 diff로 실패를 확인한 뒤 고쳐라.** 케이스 없이
   "고친 것 같다"는 착각이 142/142이 통과하는데도 버그가 있는 원인이다.
3. **`npm test`의 `vim-expected.json`은 oracle `--emit`으로 재생성.** 케이스를 추가/삭제하면
   `node --experimental-strip-types tools/oracle-diff.ts --emit`으로 스냅샷을 갱신하지 않으면
   `engine matches real vim` 테스트가 개수 불일치로 실패한다.
4. **게이팅은 `Session.keyAllowed()` 단일 진실.** 두 번째 키·텍스트 오브젝트·g 조합을 새로 추가할 때
   이 함수의 분기 순서(`textobj` 판정이 `"` 판정보다 먼저)를 지켜라.
5. **`docs/LEVELS.md`는 생성물.** 손으로 고치지 말고 `tools/gen-docs.ts`를 돌려라.
6. **오라클 숫자(현재 126)를 문서에 하드코딩하면 doc-check가 잡는다.** README/AGENTS/VIM_COVERAGE의
   "N/N"이나 "N keystroke cases"를 케이스 수와 일치시켜라.
7. **성능 예산**: 렌더 루프(`render()`)에서 객체/배열 할당 금지. 글리프 레이어는 캐시되고 커서 의존
   요소는 FX 레이어에만. 이걸 위반하면 프리징/렉이 재발한다.
8. **보안(제3자 획득 원천 차단)**: GitHub 계정은 **AI 목적 전용**이라 토큰 회전은 **불필요**하다.
   하지만 토큰 값은 절대 프롬프트·로그·커밋·채팅·이슈·PR 어디에도 출력/붙여넣지 마라.
   push 후 remote URL scrub은 항상. 상세 규칙은 `.secrets/README.md`와 `AGENTS.md` Shipping 절.

---

## 5. 완성을 위한 작업 프레임워크 (체계)

모든 작업은 다음 4개 검증 게이트를 **반드시** 통과해야 완료로 인정한다.

```
(1) 엔진 정합성   node --experimental-strip-types tools/oracle-diff.ts   # N/N 통과
(2) 레벨 무결성   npm run lint:levels                                     # 51/51
(3) 단위/타입     npm test && npx tsc --noEmit                            # 23/23, 0에러
(4) 문서 정합성   npm run doc-check                                       # OK
```

**엔진 버그 한 건의 표준 수정 루프:**
1. `tools/cases.ts`에 재현 케이스 추가 (버퍼/커서/키스트로크).
2. `node --experimental-strip-types tools/oracle-diff.ts` → 실패 확정.
3. `src/core/vim/` 수정.
4. oracle 재실행 → 통과.
5. `--emit`으로 `tests/vim-expected.json` 갱신.
6. `npm test` + `npm run lint:levels` + `npx tsc --noEmit` + `npm run doc-check` 전부 green.

**새 기능/버그 발견 시:** 먼저 위 4개 게이트의 현재 상태를 확인하고, 수정 전에 재현 케이스를
남겨라. 절대 "대충 고치고 넘어가지" 말 것 — 이 프로젝트는 142/142 oracle이 통과하는데도
엣지케이스 버그 23건이 숨어 있던 사례다.

---

## 6. 자주 쓰는 명령 레퍼런스

```bash
cd /home/jung/ai_station/sandbox/vimlore

npm install                          # deps (vite + typescript만)
npm run dev                          # http://localhost:5173
npm run build                        # dist/ + 단일 dist/vimlore.html
npm test                             # 단위 테스트 (엔진 + goals + trials)
npm run lint:levels                  # 51 스테이지 전부 검증
npm run lint:levels -- 4             # 챕터 4만
npm run doc-check                    # 문서 정합성 게이트
npm run doctor                       # 환경 진단 + doc-check 자동 실행
node --experimental-strip-types tools/oracle-diff.ts         # vs 실제 vim
node --experimental-strip-types tools/oracle-diff.ts --emit  # 스냅샷 재생성
node --experimental-strip-types tools/gen-docs.ts            # LEVELS.md 재생성
```

**실제 플레이 테스트(Playwright):**
```bash
cd /home/jung/ai_station/sandbox
node pw/audit.mjs        # 게이팅 + 스테이지1 플레이 + 에러 검증 (로컬 빌드 필요)
node pw/perf_local.mjs   # CPU 스로틀 성능 측정 (desktop/phone)
```

**로컬 서빙**: `python3 -m http.server 8138` (sandbox 루트) → `http://localhost:8138/vimlore/dist/vimlore.html`

**배포(Push)** — AGENTS.md "Shipping" 절차를 따를 것:
1. `git add -A && git commit`
2. 토큰으로 remote set-url 후 push, push 후 remote URL scrub
3. Pages 워크플로가 자동 배포. push 후 토큰 회전을 사용자에게 권고.

---

## 7. "완벽한 앱"을 위한 최종 완성 체크리스트

이 체크리스트가 전부 green이면 완성으로 간주한다.

- [ ] oracle N/N 통과 (엔진 med/low 수정 완료 후 케이스 수 갱신)
- [ ] lint:levels 51/51, npm test 23/23, tsc 0에러, doc-check OK
- [ ] 성능: desktop 60fps / phone 60fps (`perf_local.mjs`)
- [ ] 실제 플레이: `audit.mjs` 게이팅·클리어·에러 0 (로컬 빌드)
- [ ] 51개 스테이지 중 무작위 표본 5~10개 직접 플레이로 vim과 동작 일치 확인
- [ ] 커리큘럼: 각 스테이지가 의도한 스킬 하나를 "필수로" 만드는지 (우회 없음)
- [ ] GitHub push + Pages 배포 확인 + 토큰 회전 권고
