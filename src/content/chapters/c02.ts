import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 2 — WORDS & PRECISION
 *
 * Teaches: w b e W B E, r ~, f F t T ; ,
 * Design notes:
 *  - Coin stages ("collect") reward *exact* landings, so w/e/b matter.
 *  - `f`/`t` are introduced through the "static" idea: t is safer than f.
 */
export const c02: Chapter = {
  id: 'c02',
  index: 2,
  title: { en: 'TOKENS', ko: '토큰' },
  subtitle: { en: 'the lexer', ko: '어휘 분석기' },
  story: {
    en: 'Past the boot sector the memory turns into source. The lexer walks it token by token and drops a marker at every boundary. Collect them without touching the corrupt regions.',
    ko: '부트 섹터를 지나면 메모리가 소스로 변한다. 어휘 분석기가 토큰 단위로 메모리를 훑으며 경계마다 표식을 남긴다. 손상된 영역을 건드리지 말고 표식을 모아라.',
  },
  sigil: '▚',
  hue: 95,
  unlocks: ['w', 'b', 'e', 'W', 'B', 'E', 'r', '~', 'f', 'F', 't', 'T', ';', ',', 'h', 'j', 'k', 'l', '0', '$', 'x', 'i', 'a', 'A', 'o', 'O'],
  stages: [
    {
      id: 'c02s1',
      name: { en: 'TOKEN STREAM', ko: '토큰 스트림' },
      brief: {
        en: 'Land on every coin. Nothing else matters.\n\nw leaps to the next word. e lands on the end of one. b goes back.',
        ko: '모든 동전 위에 올라서라. 그 외엔 아무것도 중요하지 않다.\n\nw는 다음 단어로, e는 단어 끝으로, b는 뒤로 간다.',
      },
      text: `..$ the $cursor$ dreams $in$ words
..and $wakes$ between $them
..$`,
      goal: { type: 'collect', char: '$' },
      par: 13,
      solution: 'f$;;;;j0f$;;j',
      teaches: ['w', 'e', 'b', 'f', ';'],
      hints: [
        { en: 'f$ jumps onto the next $ in this line. ; repeats it.', ko: 'f$는 이 줄의 다음 $로 점프한다. ;는 그것을 반복한다.' },
        { en: 'f$ then ; ; ; — then j and keep going.', ko: 'f$ 그리고 ; ; ; — 그다음 j로 내려가 계속.' },
      ],
    },
    {
      id: 'c02s2',
      name: { en: 'REWIND', ko: '되감기' },
      brief: {
        en: 'Some coins fell behind you. b walks back word by word; e stops at a word\'s last letter.',
        ko: '몇 개의 동전이 등 뒤로 떨어졌다. b는 단어 단위로 뒤로 걷고, e는 단어의 마지막 글자에 선다.',
      },
      text: `..one two three four five
..$  $     $    $    $
..six seven eight`,
      goal: { type: 'collect', char: '$' },
      par: 7,
      solution: 'jf$;;;;',
      teaches: ['b', 'e', 'W', 'E'],
      hints: [
        { en: 'f$ and ; already do the job. But try b to go back a word.', ko: 'f$와 ;만으로도 된다. 하지만 b로 단어 하나 뒤로 가 보라.' },
        { en: 'Drop to the coin line with j, then f$ ; f$ ; …', ko: 'j로 동전 줄에 내려간 뒤 f$ ; f$ ; …' },
      ],
    },
    {
      id: 'c02s3',
      name: { en: 'HEX LITERAL', ko: '16진수 리터럴' },
      brief: {
        en: 'Two hex literals were typed with the letter O instead of zero. The compiler will not forgive it.\n\nr replaces one character and stays in normal mode.',
        ko: '두 개의 16진수 리터럴에 숫자 0 대신 문자 O가 들어갔다. 컴파일러는 용서하지 않는다.\n\nr은 한 글자만 바꾸고 노멀 모드에 머문다.',
      },
      text: `int a = 1O;\nint b = 2O;`,
      goal: { type: 'exact', text: `int a = 10;\nint b = 20;` },
      par: 9,
      solution: 'fOr0jfOr0',
      teaches: ['r'],
      hints: [
        { en: 'Each 1 should be an l. Each 0 should be an o.', ko: '1은 l이어야 하고, 0은 o여야 한다.' },
        { en: '2l r l, then 5l r o, then 2l r l.', ko: '2l r l, 그다음 5l r o, 그다음 2l r l.' },
      ],
    },
    {
      id: 'c02s4',
      name: { en: 'UPPERCASE', ko: '대문자' },
      brief: {
        en: 'The king wants this line screamed. ~ flips the case of a character and steps forward — and it takes a count.',
        ko: '왕은 이 줄을 소리쳐 읽기를 원한다. ~는 글자의 대소문자를 뒤집고 앞으로 나아간다. 그리고 숫자를 받는다.',
      },
      text: `shout it from the roof`,
      goal: { type: 'exact', text: 'SHOUT IT FROM THE ROOF' },
      par: 3,
      solution: '99~',
      teaches: ['~'],
      hints: [
        { en: 'Count plus ~ flips a whole line in one command.', ko: '숫자 + ~는 한 줄 전체를 한 번에 뒤집는다.' },
        { en: '99~', ko: '99~' },
      ],
    },
    {
      id: 'c02s5',
      name: { en: 'CONFIG', ko: '설정 파일' },
      brief: {
        en: 'A signpost, half-eaten. Repair the words, collect the light, and do not touch the static.',
        ko: '반쯤 먹힌 표지판. 단어를 고치고, 빛을 모으고, 정전기는 건드리지 마라.',
      },
      text: `WELCOME TO THE VILLGE
..~~~~........~~~~..
...$...$......$.....`,
      goal: { type: 'all', of: [{ type: 'exact', text: 'WELCOME TO THE VILLAGE\n..~~~~........~~~~..\n...$...$......$.....' }, { type: 'collect', char: '$' }] },
      par: 12,
      solution: 'fGiA<Esc>jj0f$;;',
      teaches: [],
      hints: [
        { en: 'VILLGE is missing an A before the G. Use w to get there.', ko: 'VILLGE에는 G 앞에 A가 빠졌다. w로 이동해.' },
        { en: 'Try fG, then iA.', ko: 'fG로 간 뒤 iA를 써 봐.' },
      ],
    },
  ],
};
