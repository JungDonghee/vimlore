import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 7 — REGISTERS
 *
 * Teaches: `"a` (named registers), `q`/`@a` (record + replay), counts on a
 * macro, and `:g` / `:v` (delete by rule).
 *
 * Design notes:
 *  - The promise is "never do the same thing twice". s1 shows the drawer, s2
 *    shows the tape, s3 hands the tape a count, s4 sharpens the rule, and the
 *    boss makes the difference loud: 36 keys by hand, 10 with one macro over
 *    nine lines.
 *  - s2 and the boss both end their macro with `j`, so a count carries the
 *    whole ritual down the list without a single extra keystroke.
 *  - s4 needs both commands: `:v/KEEP/d` drops every line that fails the stamp,
 *    and `:g/rust/d` takes the keepers the rot already reached. Neither one
 *    alone reaches the goal, so the player has to say both rules.
 *  - Every buffer starts on a `@` with `startChar: ''`, so column 0 stays
 *    honest; no buffer contains `~`, so the default hazard never bites.
 */
export const c07: Chapter = {
  id: 'c07',
  index: 7,
  title: { en: 'REGISTERS', ko: '레지스터' },
  subtitle: { en: 'the vault', ko: '금고' },
  story: {
    en: 'Below the search floor is the vault: one drawer for every value the machine refused to forget. A daemon sits at the bench with a blank tape. Show it a deed once — it will run it forever.',
    ko: '탐색의 층 아래에는 금고가 있다. 기계가 잊지 않으려 붙든 값마다 서랍이 하나씩 있다. 작업대의 데몬은 빈 테이프를 들고 앉아 있다. 한 번만 보여 주면, 영원히 되풀이한다.',
  },
  sigil: '▤',
  hue: 130,
  unlocks: ['"', 'q', '@'],
  stages: [
    // ------------------------------------------------------------------- s1
    {
      id: 'c07s1',
      name: { en: 'DRAWERS', ko: '서랍' },
      brief: {
        en: 'The vault never stores a value just once. Every entry is mirrored: north, south — then south, north.\n\nStash the first line in a drawer before the next yank overwrites the register.',
        ko: '금고는 값을 한 번만 저장하지 않는다. 모든 항목은 거울처럼 두 번 적힌다. north, south — 그리고 south, north.\n\n다음 yank가 레지스터를 덮어쓰기 전에 첫 줄을 서랍에 넣어라.',
      },
      whisper: { en: 'Drawers keep. Hands forget.', ko: '서랍은 기억하고, 손은 잊는다.' },
      startChar: '',
      text: `@key.north="LUMEN"
key.south="EMBER"`,
      goal: {
        type: 'exact',
        text: `key.north="LUMEN"
key.south="EMBER"
key.south="EMBER"
key.north="LUMEN"`,
      },
      par: 11,
      solution: '"ayyjyyp"ap',
      teaches: ['"'],
      hints: [
        {
          en: 'A double quote names the drawer: "ayy writes this line into drawer a. Plain p only reads the unnamed drawer.',
          ko: '큰따옴표가 서랍 이름을 정한다. "ayy는 이 줄을 a 서랍에 쓴다. 그냥 p는 이름 없는 서랍만 읽는다.',
        },
        {
          en: '"ayy on the first line, j then yy on the second, p for the echo. Then "ap reaches back into a.',
          ko: '첫 줄에서 "ayy, j로 내려가 둘째 줄에서 yy. p로 메아리를 놓고, "ap로 a 서랍을 다시 꺼낸다.',
        },
      ],
    },
    // ------------------------------------------------------------------- s2
    {
      id: 'c07s2',
      name: { en: 'AUTOMATON', ko: '자동인형' },
      brief: {
        en: 'The daemon has no memory of its own. It has a tape, and it keeps whatever you record on it.\n\nEvery call in this file must end with ;. Show it once, then let it run.',
        ko: '데몬은 스스로 기억하지 못한다. 테이프 하나, 그리고 네가 새긴 것만 남는다.\n\n이 파일의 모든 호출은 ;로 끝나야 한다. 한 번 보여 주고, 돌게 하라.',
      },
      whisper: { en: 'Show me once.', ko: '한 번만 보여라.' },
      startChar: '',
      text: `@vault.open()
shelf.read()`,
      goal: {
        type: 'exact',
        text: `vault.open();
shelf.read();`,
      },
      par: 9,
      solution: 'qaA;<Esc>jq@a',
      teaches: ['q', '@'],
      hints: [
        {
          en: 'q starts recording into a register and q again stops it. Every key in between is kept — even Esc.',
          ko: 'q는 레지스터에 기록을 시작하고, 다시 q로 멈춘다. 그 사이의 모든 키가 저장된다. Esc까지도.',
        },
        {
          en: 'qa, then A;<Esc>j, then q. Play it back with @a.',
          ko: 'qa, 그다음 A;<Esc>j, 그다음 q. @a로 재생한다.',
        },
      ],
    },
    // ------------------------------------------------------------------- s3
    {
      id: 'c07s3',
      name: { en: 'CHORUS', ko: '합창' },
      brief: {
        en: 'Every call in the trace is answered by its own echo. Four calls, four echoes.\n\nRecord the answer once, then tell the daemon how many times.',
        ko: '트레이스의 모든 호출은 자기 메아리로 응답받는다. 네 번의 호출, 네 번의 메아리.\n\n대답을 한 번 녹음하고, 데몬에게 몇 번인지 일러라.',
      },
      whisper: { en: 'Count for me.', ko: '대신 세어 다오.' },
      startChar: '',
      text: `@open(vault)
load(shelf)
seal(door)
close(vault)`,
      goal: {
        type: 'exact',
        text: `open(vault)
open(vault)
load(shelf)
load(shelf)
seal(door)
seal(door)
close(vault)
close(vault)`,
      },
      par: 10,
      solution: 'qayypjq3@a',
      teaches: ['@'],
      hints: [
        {
          en: 'The macro already ends one line lower. A number before @a runs the whole tape that many times.',
          ko: '매크로는 이미 한 줄 아래에서 끝난다. @a 앞에 숫자를 붙이면 테이프 전체를 그만큼 돌린다.',
        },
        {
          en: 'qa yyp j q records the echo. Then 3@a answers the other three calls.',
          ko: 'qa yyp j q로 메아리를 녹음한다. 그다음 3@a가 남은 세 호출에 답한다.',
        },
      ],
    },
    // ------------------------------------------------------------------- s4
    {
      id: 'c07s4',
      name: { en: 'SIEVE', ko: '체' },
      brief: {
        en: 'The manifest is stale. Most lines must go, and rot has reached even the KEEP entries.\n\nSay the rule. Do not touch the lines one by one.',
        ko: '매니페스트가 낡았다. 대부분 버려야 하고, 썩음은 KEEP 항목까지 닿았다.\n\n규칙을 말하라. 줄을 하나씩 손대지 마라.',
      },
      whisper: { en: 'Rules, not fingers.', ko: '손가락이 아니라 규칙.' },
      startChar: '',
      text: `@KEEP 01 rust.nail
KEEP 02 iron.key
LOST 03 paper.map
KEEP 04 rust.gear
LOST 05 river.stone
KEEP 06 rust.seal
LOST 07 dry.leaf
KEEP 08 rust.bell
LOST 09 chalk.dust
KEEP 10 rust.pin
KEEP 11 brass.gear
KEEP 12 salt.jar`,
      goal: {
        type: 'exact',
        text: `KEEP 02 iron.key
KEEP 11 brass.gear
KEEP 12 salt.jar`,
      },
      par: 20,
      solution: ':v/KEEP/d<CR>:g/rust/d<CR>',
      teaches: [':g'],
      hints: [
        {
          en: ':g/pattern/d deletes every line that matches. :v/pattern/d deletes every line that does not.',
          ko: ':g/패턴/d는 일치하는 줄을 모두 지운다. :v/패턴/d는 일치하지 않는 줄을 모두 지운다.',
        },
        {
          en: ':v/KEEP/d keeps only the stamped lines. Then :g/rust/d takes the keepers the rot reached.',
          ko: ':v/KEEP/d로 도장 찍힌 줄만 남긴다. 그다음 :g/rust/d가 썩음이 닿은 항목을 가져간다.',
        },
        {
          en: 'One rule is not enough: a keeper can still be rotten. Order does not matter — run both sieves.',
          ko: '규칙 하나로는 부족하다. 도장 찍힌 항목도 썩을 수 있다. 순서는 상관없다. 체를 둘 다 돌려라.',
        },
      ],
    },
    // ------------------------------------------------------------------- s5
    {
      id: 'c07s5',
      name: { en: 'FACTORY', ko: '공장' },
      brief: {
        en: 'Nine config lines, nine doors, one crooked prefix on every line.\n\nRecord the fix once, then give it a number and walk away.',
        ko: '아홉 줄의 설정, 아홉 개의 문, 모든 줄에 똑같이 비뚤어진 접두사.\n\n고치는 동작을 한 번 녹음하고, 숫자를 붙여 두고 떠나라.',
      },
      whisper: { en: 'Nine times is once, if you remember.', ko: '기억한다면 아홉 번도 한 번이다.' },
      startChar: '',
      text: `@>>gear.brass = 3
>>key.iron = 1
>>jar.salt = 7
>>eye.glass = 2
>>bell.tin = 5
>>seal.wax = 4
>>dust.chalk = 9
>>stone.river = 6
>>pin.bent = 8`,
      goal: {
        type: 'exact',
        text: `gear.brass = 3
key.iron = 1
jar.salt = 7
eye.glass = 2
bell.tin = 5
seal.wax = 4
dust.chalk = 9
stone.river = 6
pin.bent = 8`,
      },
      par: 10,
      solution: 'qa02xjq8@a',
      teaches: ['q', '@'],
      hints: [
        {
          en: 'Every line wears the same two characters at the start. One recorded fix can travel the whole shelf.',
          ko: '모든 줄이 똑같이 두 글자를 이고 있다. 한 번 녹음한 수정이 선반 끝까지 내려간다.',
        },
        {
          en: 'qa 02x j q records it. 8@a runs the same fix eight more times.',
          ko: 'qa 02x j q로 녹음한다. 8@a가 같은 수정을 여덟 번 더 실행한다.',
        },
        {
          en: 'Count the lines you still have to touch, not the lines you can see.',
          ko: '눈에 보이는 줄이 아니라, 아직 손대야 할 줄을 세어라.',
        },
      ],
    },
  ],
};
