# Korean style — plain/banmal only

All Korean user-facing copy uses **해라체 (plain/banmal)**. No honorifics, no
polite endings, no `-요`.

## Register

- **Narration:** present plain `-다`. “도시는 문서다.” “시계는 06:23이다.”
- **Instruction:** `-아라 / -어라` or a nominal command. “커서를 옮겨라.”
  “아무 키나 누른다.”
- **Dialogue:** banmal. “늦었군.” “묻지 마라.” “지금이다.”
- **UI labels:** short noun/plain form. “시작”, “재시작”, “나가기”.
- **ORACLE:** bracketed plain diagnostics. `[oracle] 삭제할 수 있다.`
- **REGISTRAR:** regulation prose in plain form, not polite service voice.

## Forbidden endings

`-습니다`, `-입니다`, `-합니다`, `-됩니다`, `-드립니다`, `-아닙니다`,
`-세요`, `-해요`, `-주세요`, `-십시오`, `-까요`, `-네요`, `-어요`, `-아요`,
`-시다`, and honorific `-시-` forms.

## Examples

| wrong | right |
|---|---|
| 아무 키나 누르세요 | 아무 키나 누른다 |
| 물리 키보드가 필요합니다 | 물리 키보드가 필요하다 |
| 이 작업은 되돌릴 수 없습니다 | 되돌릴 수 없다 |
| 영문 입력으로 바꿔 주세요 | 영문 입력으로 바꿔라 |
| 모든 진행을 지울까요? | 모든 진행을 지운다? |
| 챔버를 떠날까? | 챔버를 떠난다 |
| 마지막 줄을 만지지 마십시오 | 마지막 줄을 만지지 마라 |

## Enforcement

```bash
npm run korean:check
```

Scans `src/**/*.ts`, `docs/story/*.md`, and `public/pwa.js`. CI runs it after
`doc-check`. The rule is lexical, not stylistic: if a forbidden ending appears,
the gate fails.
