import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 7 — MEMORY
 *
 * Teaches: `"a` (named registers), `q`/`@a` (record + replay), counts on a
 * macro, and `:g` / `:v` (delete by rule).
 *
 * Design notes:
 *  - The chapter's promise is "never do the same thing twice". Stage 1 shows
 *    the drawer; stage 2 shows the hand that can be recorded; stage 3 hands it
 *    a count; stage 4 sharpens the rule; the boss makes the difference loud
 *    (36 keys by hand, 10 with a macro over nine lines).
 *  - Stage 2 and the boss both end their macro with `j`, so a count carries
 *    the ritual down the list without a single extra keystroke.
 *  - The `:g`/`:v` stage needs both commands: one line passes the keepers
 *    stamp and still has to die, which is exactly the overlap `:v` cannot see.
 *  - No tildes in any buffer, so the default hazard never bites. Chapter 7 is
 *    about memory, not aim.
 */
export const c07: Chapter = {
  id: 'c07',
  index: 7,
  title: { en: 'REGISTERS', ko: '레지스터' },
  subtitle: { en: 'the vault', ko: '금고' },
  story: {
    en: 'Below the search floor the vault is lined with drawers, and every drawer remembers a hand. On the bench an automaton waits for one deed worth repeating.',
    ko: '탐색의 층 아래, 금고 벽에는 서랍이 늘어서 있다. 서랍마다 손길을 기억한다. 작업대 위의 자동인형은 되풀이할 단 하나의 동작을 기다린다.',
  },
  sigil: '▤',
  hue: 130,
  unlocks: ['"', 'q', '@', ':'],
  stages: [
    // ------------------------------------------------------------------- s1
    {
      id: 'c07s1',
      name: { en: 'Drawers', ko: '서랍' },
      brief: {
        en: 'The vault trusts nothing written once. Every name is doubled, and the mirror at the bottom climbs back up.\n\nReach into a drawer before the copy in your hand becomes the only copy.',
        ko: '금고는 한 번 적힌 것을 믿지 않는다. 모든 이름은 두 번 적히고, 바닥의 거울은 거꾸로 올라온다.\n\n손안의 사본이 유일한 사본이 되기 전에, 서랍을 하나 열어 두어라.',
      },
      whisper: { en: 'Drawers remember. Hands forget.', ko: '서랍은 기억한다. 손은 잊는다.' },
      text: `|@north door: LUMEN
| south door: EMBER`,
      goal: {
        type: 'exact',
        text: `| north door: LUMEN
| south door: EMBER
| south door: EMBER
| north door: LUMEN`,
      },
      par: 11,
      solution: '"ayyjyyp"ap',
      teaches: ['"'],
      hints: [
        {
          en: 'A double quote names the drawer. "ayy stashes this line in drawer a. p alone only ever uses the unnamed drawer.',
          ko: '큰따옴표가 서랍 이름을 정한다. "ayy는 이 줄을 a 서랍에 넣는다. 그냥 p는 언제나 이름 없는 서랍만 쓴다.',
        },
        {
          en: '"ayy on the top line, j then yy on the second. p lays the echo, and "ap reaches back for the first line.',
          ko: '첫 줄에서 "ayy, j로 내려가 둘째 줄에서 yy. p로 메아리를 놓고, "ap로 첫 줄을 다시 꺼내라.',
        },
      ],
    },
    // ------------------------------------------------------------------- s2
    {
      id: 'c07s2',
      name: { en: 'The Automaton', ko: '자동인형' },
      brief: {
        en: 'An automaton of brass and patience sits at the bench. It remembers nothing on its own — only what you show it.\n\nEvery entry must be sealed with ;. Show it once, then let it repeat.',
        ko: '놋쇠와 인내로 만든 자동인형이 작업대에 앉아 있다. 스스로는 아무것도 기억하지 못한다. 보여 준 것만 기억한다.\n\n모든 항목은 ;로 봉인해야 한다. 한 번만 보여 주고, 되풀이하게 하라.',
      },
      whisper: { en: 'Show me once.', ko: '한 번만 보여라.' },
      text: `|@01 brass gear
| 02 iron key`,
      goal: {
        type: 'exact',
        text: `| 01 brass gear;
| 02 iron key;`,
      },
      par: 9,
      solution: 'qaA;<Esc>jq@a',
      teaches: ['q', '@'],
      hints: [
        {
          en: 'q starts recording into a register; q again stops it. Every key in between is kept — even Esc.',
          ko: 'q는 레지스터에 기록을 시작하고, 다시 q로 멈춘다. 그 사이의 모든 키가 저장된다. Esc까지도.',
        },
        {
          en: 'qa, then A;<Esc>j, then q. Play the deed back with @a.',
          ko: 'qa, 그다음 A;<Esc>j, 그다음 q. @a로 그 동작을 재생한다.',
        },
      ],
    },
    // ------------------------------------------------------------------- s3
    {
      id: 'c07s3',
      name: { en: 'Chorus', ko: '합창' },
      brief: {
        en: 'Four voices wait in the dark, each for its own echo.\n\nRecord the answer once. Then tell the automaton how many times.',
        ko: '어둠 속의 네 목소리가 저마다 자기 메아리를 기다린다.\n\n대답을 한 번 녹음하고, 자동인형에게 몇 번인지 일러라.',
      },
      whisper: { en: 'Count for me.', ko: '대신 세어 다오.' },
      text: `first: wake
second: turn
third: open
fourth: close`,
      goal: {
        type: 'exact',
        text: `first: wake
first: wake
second: turn
second: turn
third: open
third: open
fourth: close
fourth: close`,
      },
      par: 10,
      solution: 'qayypjq3@a',
      teaches: ['@'],
      hints: [
        {
          en: 'The macro already ends one line lower. A number in front of @a runs the whole deed that many times.',
          ko: '매크로는 이미 한 줄 아래에서 끝난다. @a 앞에 숫자를 붙이면 그 동작을 그만큼 실행한다.',
        },
        {
          en: 'qa yyp j q records the echo. Then 3@a answers the other three voices.',
          ko: 'qa yyp j q로 메아리를 녹음한다. 그다음 3@a가 남은 세 목소리에 답한다.',
        },
      ],
    },
    // ------------------------------------------------------------------- s4
    {
      id: 'c07s4',
      name: { en: 'Sieve', ko: '체' },
      brief: {
        en: 'The rot has reached even the stamped entries, and one line still wears the automaton\'s question mark.\n\nSay the rule. Then take the doubt off yourself.',
        ko: '썩음은 도장 찍힌 항목까지 닿았다. 그리고 한 줄은 아직 자동인형의 물음표를 달고 있다.\n\n규칙을 말하라. 그다음 그 의심만 손으로 떼어라.',
      },
      whisper: { en: 'Rules, not fingers.', ko: '손가락이 아니라 규칙.' },
      text: `KEEP 01 rust nail
?KEEP 02 iron key
LOST 03 paper map
KEEP 04 rust gear
LOST 05 river stone
KEEP 06 rust seal
LOST 07 dry leaf
KEEP 08 rust bell
LOST 09 chalk dust
KEEP 10 rust pin
KEEP 11 brass gear
KEEP 12 salt jar`,
      goal: {
        type: 'exact',
        text: `KEEP 02 iron key
KEEP 11 brass gear
KEEP 12 salt jar`,
      },
      par: 21,
      solution: ':v/KEEP/d<CR>:g/rust/d<CR>x',
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
          en: 'One question mark still leans on the first line. x, where you land, takes it off.',
          ko: '첫 줄에 물음표가 하나 남아 있다. 도착한 자리에서 x로 떼어 낸다.',
        },
      ],
    },
    // ------------------------------------------------------------------- s5
    {
      id: 'c07s5',
      name: { en: 'The Factory', ko: '공장' },
      brief: {
        en: 'Nine ledgers, nine doors, and the same crooked stamp on every line.\n\nRecord the fix once. Then give it a number and walk away.',
        ko: '아홉 권의 장부, 아홉 개의 문, 그리고 모든 줄에 똑같이 비뚤어진 도장.\n\n고치는 동작을 한 번 녹음하고, 숫자를 붙여 두고 떠나라.',
      },
      whisper: { en: 'Nine times is once, if you remember.', ko: '기억한다면 아홉 번도 한 번이다.' },
      text: `>>01 brass gear: 3
>>02 iron key: 1
>>03 salt jar: 7
>>04 glass eye: 2
>>05 tin bell: 5
>>06 wax seal: 4
>>07 chalk dust: 9
>>08 river stone: 6
>>09 bent pin: 8`,
      goal: {
        type: 'exact',
        text: `01 brass gear: 3
02 iron key: 1
03 salt jar: 7
04 glass eye: 2
05 tin bell: 5
06 wax seal: 4
07 chalk dust: 9
08 river stone: 6
09 bent pin: 8`,
      },
      par: 10,
      solution: 'qa02xjq8@a',
      teaches: ['q', '@'],
      hints: [
        {
          en: 'Every line wears the same two characters at the start. One recorded fix can travel down the whole shelf.',
          ko: '모든 줄이 똑같이 두 글자를 이고 있다. 한 번 녹음한 수정이 선반 끝까지 내려갈 수 있다.',
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
