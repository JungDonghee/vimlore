import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 6 — LANTERN (search & replace)
 *
 * Teaches: / ? n N * # :s :%s
 * Design notes:
 *  - s1 and s2 use the invisible `cursor` goal on purpose: the mark is a word,
 *    described in the brief, so the search must do the finding. A glowing `*`
 *    would give the answer away and turn the hunt into a walk.
 *  - s1's decoy "dusty" makes `n` necessary; s2's compound words make `*`
 *    necessary where `/moth` would stop inside "mothball".
 *  - s3 vs s4 is the chapter's spine: one line (a scalpel) vs every line (a
 *    flood). s3's other lines already say "ashen", so `:%s/ash/` would wound
 *    them into "ashenen".
 *  - The boss leaves the same trap in longer words: only `*` (word-bounded) +
 *    `:%s//` can rename the shapeshifter without breaking "mothball".
 */
export const c06: Chapter = {
  id: 'c06',
  index: 6,
  title: { en: 'GREP', ko: '검색' },
  subtitle: { en: 'the hunt', ko: '사냥' },
  story: {
    en: 'The library goes dark at dusk. Something in the shelves is wearing a word that is not its own — one letter off, one coat too many. A lantern only lights what you name.',
    ko: '황혼이 되면 서고가 어두워진다. 책장 어딘가, 무언가가 제 것이 아닌 단어를 걸치고 있다. 한 글자 어긋나고, 겉옷을 하나 더 입은 채로. 등불은 이름을 부른 것만 비춘다.',
  },
  sigil: '◉',
  hue: 130,
  unlocks: ['/', '?', 'n', 'N', '*', '#', ':'],
  stages: [
    {
      id: 'c06s1',
      name: { en: 'The Odd Word', ko: '이상한 단어' },
      brief: {
        en: 'Twelve copies of one chant. On one line the lantern says "dust" where the chant should say "dusk".\n\nStand on the first letter of the break — and do not let the page fool you.',
        ko: '같은 주문이 열두 번 적혀 있다. 한 줄에서만 등불이 "dusk"라고 말해야 할 자리에서 "dust"라고 말한다.\n\n금이 간 곳의 첫 글자 위에 서라. 페이지에 속지 마라.',
      },
      whisper: {
        en: '`/` names a word; `n` walks to the next match.',
        ko: '`/`는 단어의 이름을 부른다. `n`은 다음 일치로 걷는다.',
      },
      startChar: 't',
      text: `@he dusk keeps the lantern lit
the dusk keeps the lantern lit
the dusty glass keeps the lantern lit
the dusk keeps the lantern lit
the dusk keeps the lantern lit
the dusk keeps the lantern lit
the dusk keeps the lantern lit
the dust keeps the lantern lit
the dusk keeps the lantern lit
the dusk keeps the lantern lit
the dusk keeps the lantern lit
the dusk keeps the lantern lit`,
      goal: { type: 'cursor', line: 7, col: 4 },
      par: 7,
      solution: '/dust<CR>n',
      teaches: ['/', 'n'],
      hints: [
        {
          en: 'Type `/dust` and press Enter. The cursor lands on the first match.',
          ko: '`/dust`를 치고 Enter를 눌러라. 커서가 첫 일치 위에 선다.',
        },
        {
          en: 'The first match hides inside "dusty" — not the odd word. Press `n` for the next match.',
          ko: '첫 일치는 "dusty" 속에 숨어 있다. 이상한 단어가 아니다. `n`으로 다음 일치로 가라.',
        },
        {
          en: 'The break is near the bottom. The mark is the first letter of the "dust" there.',
          ko: '금이 간 줄은 아래쪽에 있다. 표식은 그 줄 "dust"의 첫 글자다.',
        },
      ],
    },
    {
      id: 'c06s2',
      name: { en: 'Under the Cursor', ko: '커서 아래의 단어' },
      brief: {
        en: 'The bestiary names the true moth four times. A crowd of other words wear its four letters — mothball, mothlight, mothwing — but they are only coats.\n\nStand on the first true name. Walk to the third: that is the mark.',
        ko: '야수 도감은 진짜 "moth"를 네 번 부른다. 수많은 다른 단어가 그 네 글자를 걸치고 있다. mothball, mothlight, mothwing…. 그러나 그것들은 겉옷일 뿐이다.\n\n첫 번째 진짜 이름 위에 서라. 세 번째까지 걸어가라. 그곳이 표식이다.',
      },
      whisper: {
        en: '`*` hunts the word under you; `#` hunts the same word backwards.',
        ko: '`*`는 네가 딛고 선 단어를 사냥한다. `#`는 같은 단어를 뒤로 사냥한다.',
      },
      startChar: 'm',
      text: `@oth is the lantern keeper's name
mothball, mothlight, mothwing, mothless
a mothball sleeps in the silver drawer
mothlight is the shadow of a word
the moth is a name the lantern keeps
mothwing, mothless, mothball, mothlight
mothproof is how a word survives
mothlike, mothwing, mothball, mothlight
the moth is a page the lantern turns
mothlight, mothless, mothproof, mothball
mothball is a word that hides a word
the moth keeps the lantern awake`,
      goal: { type: 'cursor', line: 8, col: 4 },
      par: 2,
      solution: '*n',
      teaches: ['*'],
      hints: [
        {
          en: '`*` searches the whole word under the cursor. It will not stop inside "mothball".',
          ko: '`*`는 커서 아래 단어를 통째로 검색한다. "mothball" 속에서는 멈추지 않는다.',
        },
        {
          en: 'You are on the first name. `*` lands on the second; then `n` lands on the third.',
          ko: '너는 첫 번째 이름 위에 있다. `*`가 두 번째로, 이어서 `n`이 세 번째로 데려간다.',
        },
        {
          en: 'If you ever pass it, `#` walks the same names backwards.',
          ko: '지나쳐 버렸다면 `#`로 같은 이름들을 거꾸로 걸어라.',
        },
      ],
    },
    {
      id: 'c06s3',
      name: { en: 'The Scalpel', ko: '메스' },
      brief: {
        en: 'Every line of the rite should read "the ashen lantern". One line is unfinished — it says "ash", and you are standing on it.\n\nRepair this line. Only this line: the others are already whole.',
        ko: '의식의 모든 줄은 "the ashen lantern"이어야 한다. 한 줄만 아직 덜 쓰였다. "ash"라고 적혀 있고, 너는 그 줄 위에 서 있다.\n\n이 줄만 고쳐라. 나머지는 이미 온전하다.',
      },
      whisper: {
        en: '`:` opens the command line. `:s` works on the line you are standing on.',
        ko: '`:`는 명령줄을 연다. `:s`는 네가 선 줄에서만 일한다.',
      },
      startChar: 't',
      text: `@he ash lantern burns alone
the ashen lantern burns alone
the ashen lantern burns alone
the ashen lantern burns alone
the ashen lantern burns alone`,
      goal: {
        type: 'exact',
        text: `the ashen lantern burns alone
the ashen lantern burns alone
the ashen lantern burns alone
the ashen lantern burns alone
the ashen lantern burns alone`,
      },
      par: 14,
      solution: ':s/ash/ashen/<CR>',
      teaches: [':s'],
      hints: [
        {
          en: '`:s/ash/ashen/` — substitute "ash" with "ashen" on this line, then press Enter.',
          ko: '`:s/ash/ashen/` — 이 줄에서 "ash"를 "ashen"으로 바꾼다. Enter를 눌러라.',
        },
        {
          en: 'The other lines already hold "ashen". A flood from `:%s` would strike the "ash" inside them and leave "ashenen".',
          ko: '다른 줄들은 이미 "ashen"을 품고 있다. `:%s`의 범람은 그 안의 "ash"까지 쳐서 "ashenen"을 남길 것이다.',
        },
        {
          en: 'You are on the broken line already. No search is needed — this is a scalpel, not a flood.',
          ko: '너는 이미 깨진 줄 위에 있다. 검색은 필요 없다. 이것은 범람이 아니라 메스다.',
        },
      ],
    },
    {
      id: 'c06s4',
      name: { en: 'The Flood', ko: '범람' },
      brief: {
        en: 'The chant is written in dusk from wall to wall — once or twice on a line. The lantern at the end is waiting for dawn.\n\nTurn every dusk to dawn. One command, the whole page.',
        ko: '주문은 벽에서 벽까지 "dusk"로 적혀 있다. 한 줄에 한 번, 혹은 두 번. 끝의 등불은 "dawn"을 기다린다.\n\n모든 "dusk"를 "dawn"으로. 한 번의 명령으로, 페이지 전체를.',
      },
      whisper: {
        en: '`:%s` is the flood. The `g` on its tail takes every one on a line.',
        ko: '`:%s`는 범람이다. 끝의 `g`가 한 줄의 모든 것을 쓸어간다.',
      },
      startChar: 'd',
      text: `@usk is a lantern, dusk is a door
dusk is a stairway, dusk is a floor
dusk is a mirror, dusk is a drawer
dusk is a lantern, dusk is a door
dusk is a stairway, dusk is a floor
dusk is a mirror, dusk is a drawer
dusk is a name that the lantern keeps`,
      goal: {
        type: 'exact',
        text: `dawn is a lantern, dawn is a door
dawn is a stairway, dawn is a floor
dawn is a mirror, dawn is a drawer
dawn is a lantern, dawn is a door
dawn is a stairway, dawn is a floor
dawn is a mirror, dawn is a drawer
dawn is a name that the lantern keeps`,
      },
      par: 16,
      solution: ':%s/dusk/dawn/g<CR>',
      teaches: [':%s'],
      hints: [
        {
          en: '`:%s/dusk/dawn/g` — `%` is the whole file, `g` is every hit on each line.',
          ko: '`:%s/dusk/dawn/g` — `%`는 문서 전체, `g`는 각 줄의 모든 일치다.',
        },
        {
          en: 'Drop the final `g` and only the first dusk on each line would change. The chant would still be half dusk.',
          ko: '마지막 `g`를 빼면 각 줄의 첫 "dusk"만 바뀐다. 주문은 여전히 반쯤 "dusk"로 남는다.',
        },
        {
          en: 'Type the command once and press Enter. The flood does not need a count.',
          ko: '명령을 한 번 치고 Enter를 눌러라. 범람에는 숫자가 필요 없다.',
        },
      ],
    },
    {
      id: 'c06s5',
      name: { en: 'The Chameleon', ko: '카멜레온' },
      brief: {
        en: 'For a hundred years it has worn the word "moth": in capitals, behind commas, in the shadow of an apostrophe. It also leaves traps — longer words that wear the same four letters but are not it at all.\n\nStand on it. Let `*` name it, walk its faces with `n`, then let `:%s//` speak its true name, "moon", into every line.',
        ko: '백 년 동안 그것은 "moth"라는 단어를 걸치고 있다. 대문자로, 쉼표 뒤에, 아포스트로피 그늘에. 함정도 남긴다. 같은 네 글자를 걸쳤지만 그것이 아닌 더 긴 단어들.\n\n그 위에 서라. `*`에게 이름을 부르게 하고, `n`으로 그 얼굴들을 걸어라. 그다음 `:%s//`가 참 이름 "moon"을 모든 줄에 말하게 하라.',
      },
      whisper: {
        en: 'An empty pattern in `:s//` means the last thing you searched. `*` just filled it.',
        ko: '`:s//`의 빈 패턴은 마지막으로 검색한 것을 뜻한다. 방금 `*`가 그것을 채웠다.',
      },
      startChar: 'm',
      text: `@oth at the lantern, Moth on the stair
the moth's wing is a page
a mothball sleeps in the drawer
moth, moth, the lantern calls
the Moth has worn a hundred faces
moth in the ash and Moth in the glass
a mothball keeps its old name
the moth keeps the lantern awake
Moth, says the lantern, Moth
the moth is a name that moves`,
      goal: {
        type: 'exact',
        text: `moon at the lantern, moon on the stair
the moon's wing is a page
a mothball sleeps in the drawer
moon, moon, the lantern calls
the moon has worn a hundred faces
moon in the ash and moon in the glass
a mothball keeps its old name
the moon keeps the lantern awake
moon, says the lantern, moon
the moon is a name that moves`,
      },
      par: 14,
      solution: '*n:%s//moon/g<CR>',
      teaches: [],
      hints: [
        {
          en: 'Start on the word. `*` searches the whole word — "mothball" and "mothlight" are other words and will not answer.',
          ko: '단어 위에서 시작하라. `*`는 단어 전체를 검색한다. "mothball"과 "mothlight"는 다른 단어라 응답하지 않는다.',
        },
        {
          en: '`n` walks to the next face. Then `:%s//moon/g` reuses the search: no retyping, and the traps stay whole.',
          ko: '`n`은 다음 얼굴로 걷는다. 그다음 `:%s//moon/g`는 그 검색을 다시 쓴다. 단어를 다시 치지 않아도 되고, 함정은 온전히 남는다.',
        },
        {
          en: 'Try typing `:%s/moth/moon/g` and the mothball would turn to "moonball". The goal knows the difference.',
          ko: '`:%s/moth/moon/g`를 치면 "mothball"이 "moonball"이 된다. 목표는 그 차이를 안다.',
        },
      ],
    },
  ],
};
