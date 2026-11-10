import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 4 — TEXT OBJECTS
 *
 * Teaches: iw aw, i" a", i( a( (ib), ip, it — nouns with shapes.
 * Design notes:
 *  - Every stage starts the cursor *inside* the thing, never at its edge:
 *    the object must do the walking.
 *  - i vs a is the recurring knife edge: daw keeps the spacing clean,
 *    diw leaves a double space; da" takes the quotes, di" leaves a hole.
 *  - The boss puts a quoted string inside braces inside a tag, so i" and i{
 *    are both available and only one of them matches the page's intent.
 *  - commands.ts has no id for i{ yet, so the boss lists i( (the bracket
 *    family) in teaches; the hint names i{ directly.
 *  - unlocks is empty: text objects are typed after an operator, and the gate
 *    only checks command starts.
 */
export const c04: Chapter = {
  id: 'c04',
  index: 4,
  title: { en: 'OBJECTS', ko: '형태' },
  subtitle: { en: 'the garden', ko: '정원' },
  story: {
    en: 'Past the verbs the page becomes a garden. The hedges are cut into brackets, the beds laid out like words. Everything here has an inside and an outside.',
    ko: '동사들을 지나면 페이지가 정원이 된다. 울타리는 괄호 모양으로 잘리고, 화단은 단어처럼 놓여 있다. 이곳의 모든 것에는 안쪽과 바깥쪽이 있다.',
  },
  sigil: '❖',
  hue: 130,
  unlocks: [],
  stages: [
    {
      id: 'c04s1',
      name: { en: 'Inside the Word', ko: '단어 속' },
      brief: {
        en: 'A bell rings when it should not. A keeper listens when he should be waiting. The page wants both lines clean: the bell rings, and the keeper waits.',
        ko: '종은 울리면 안 될 때 울린다. 문지기는 기다려야 할 때 귀를 기울이고 있다. 페이지는 두 줄이 깨끗해지길 바란다: 종은 울리고, 문지기는 기다린다.',
      },
      whisper: {
        en: 'i is the inside of a word. a is the inside plus its skin.',
        ko: 'i는 단어의 안쪽, a는 안쪽과 껍질까지.',
      },
      text: `The old bell v@ry rings in the hall
The keeper listens from the wall`,
      startChar: 'e',
      goal: {
        type: 'exact',
        text: `The old bell rings in the hall
The keeper waits from the wall`,
      },
      par: 13,
      solution: 'dawjciwwaits<Esc>',
      teaches: ['iw', 'aw'],
      hints: [
        {
          en: 'You are standing in the middle of a word. iw does not care where. ciw replaces the whole word; cw would only eat the rest of its tail.',
          ko: '너는 단어 한가운데에 서 있다. iw는 위치를 따지지 않는다. ciw는 단어 전체를 바꾸고, cw는 남은 꼬리만 먹는다.',
        },
        {
          en: 'daw on "very" — here a is right, because a word that leaves should take its space with it. Then j, then ciwwaits.',
          ko: '"very" 위에서 daw — 여기서는 a가 맞다. 떠나는 단어는 자기 공백까지 데려가야 하니까. 그다음 j, 그다음 ciwwaits.',
        },
      ],
    },
    {
      id: 'c04s2',
      name: { en: 'The Quarantine', ko: '격리' },
      brief: {
        en: 'A quarantine notice, half true. The east gate is iron now. The side door has no name — take the whole quoted word, walls and all.',
        ko: '절반만 맞는 격리 공지. 동쪽 문은 이제 쇠로 되어 있다. 옆문에는 이름이 없다 — 인용된 말을 벽까지 통째로 가져가라.',
      },
      whisper: {
        en: 'Quotes are walls. i stays inside. a carries the wall away.',
        ko: '따옴표는 벽이다. i는 안에 머물고, a는 벽을 데리고 간다.',
      },
      text: `Lock the "e@st" gate.
Seal the "side" door.`,
      startChar: 'a',
      goal: {
        type: 'exact',
        text: `Lock the "iron" gate.
Seal the door.`,
      },
      par: 12,
      solution: 'ci"iron<Esc>jda"',
      teaches: ['i"', 'a"'],
      hints: [
        {
          en: 'Stand anywhere inside the quotes and ci" — the quote marks never move.',
          ko: '따옴표 안 아무 데나 서서 ci" — 따옴표는 움직이지 않는다.',
        },
        {
          en: 'On line two, a" includes the quotes themselves. da" leaves "Seal the door."',
          ko: '둘째 줄에서 a"는 따옴표까지 포함한다. da"를 쓰면 "Seal the door."가 남는다.',
        },
      ],
    },
    {
      id: 'c04s3',
      name: { en: 'Arguments', ko: '인자' },
      brief: {
        en: 'A boot script still holds arguments it has forgotten how to use. Empty both calls. The parentheses are the frame — leave them standing.',
        ko: '부팅 스크립트가 이제 쓸모없는 인자를 아직 붙들고 있다. 두 호출을 비워라. 괄호는 틀이다 — 그대로 세워 두어라.',
      },
      whisper: {
        en: 'i( has a twin named ib. Same door, two names.',
        ko: 'i(에는 ib라는 쌍둥이가 있다. 같은 문, 두 이름.',
      },
      text: `start(engine, fuel)
connect(
  h@st,
  port,
  token
)`,
      startChar: 'o',
      goal: {
        type: 'exact',
        text: `start()
connect()`,
      },
      par: 7,
      solution: 'di(kdi(',
      teaches: ['i(', 'a('],
      hints: [
        {
          en: 'di( clears everything between the nearest parentheses, even when the arguments run across lines. a( would take the brackets with it.',
          ko: 'di(는 가장 가까운 괄호 사이를 전부 비운다. 인자가 여러 줄에 걸쳐 있어도 그렇다. a(는 괄호까지 가져간다.',
        },
        {
          en: 'Start inside the long call: di(. Then k lands inside start(engine, fuel) — di( again.',
          ko: '긴 호출 안에서 시작: di(. 그다음 k로 start(engine, fuel) 안으로 올라가 다시 di(.',
        },
      ],
    },
    {
      id: 'c04s4',
      name: { en: 'Field Notes', ko: '현장 기록' },
      brief: {
        en: 'Field notes from a tower that never had a fog. Strike the fog paragraph whole — both lines and the empty air after them. Then empty the draft inside its <p> tags; the tags stay.',
        ko: '안개가 없던 탑의 현장 기록. 안개 문단을 통째로 걷어내라 — 두 줄과 그 뒤의 빈 공기까지. 그다음 초안을 <p> 태그 안에서 비워라. 태그는 남는다.',
      },
      whisper: {
        en: 'A paragraph is mostly the air around it.',
        ko: '문단은 대부분 그 둘레의 공기다.',
      },
      text: `<article>
<h1>Field Notes</h1>

The @og came early and stayed.
It took the road with it.

<p>draft: the tower is empty</p>
</article>`,
      startChar: 'f',
      goal: {
        type: 'exact',
        text: `<article>
<h1>Field Notes</h1>

<p></p>
</article>`,
      },
      par: 6,
      solution: 'dapdit',
      teaches: ['ip', 'it'],
      hints: [
        {
          en: 'ap takes the paragraph and the blank line after it. ip stops at the last line of text.',
          ko: 'ap는 문단과 그 뒤의 빈 줄까지 가져간다. ip는 글자가 끝나는 줄에서 멈춘다.',
        },
        {
          en: 'dap on the fog. You land on the <p> tag itself; dit empties it from there — at would take the tags too.',
          ko: '안개 위에서 dap. <p> 태그 위에 그대로 내려앉는다. 거기서 dit가 속을 비운다 — at는 태그까지 가져간다.',
        },
      ],
    },
    {
      id: 'c04s5',
      name: { en: 'The Nest', ko: '둥지' },
      brief: {
        en: 'The log keeps two shapes, each a quoted word inside braces inside a tag. The vow must be loud, still quoted. The gate stands open now and keeps no quotation marks — only the word.',
        ko: '기록은 두 개의 형태를 품는다. 둘 다 태그 안의 괄호, 그 안의 인용된 말이다. 서약은 여전히 인용된 채로 크게 울려야 한다. 문은 이제 열려 있고 따옴표를 두지 않는다 — 오직 그 말만.',
      },
      whisper: {
        en: 'At the same cursor, i" sees a string and i{ sees the whole object. Choose the shape you mean.',
        ko: '같은 커서에서 i"는 문자열을, i{는 객체 전체를 본다. 네가 뜻한 모양을 골라라.',
      },
      text: `<div>
  <pre>{vow: "qu@et"}</pre>
  <pre>{gate: "shut"}</pre>
</div>`,
      startChar: 'i',
      goal: {
        type: 'exact',
        text: `<div>
  <pre>{vow: "loud"}</pre>
  <pre>{open}</pre>
</div>`,
      },
      par: 17,
      solution: 'ci"loud<Esc>jci{open<Esc>',
      teaches: ['i"', 'i('],
      hints: [
        {
          en: 'The first line only changes the string: ci"loud. The braces and quotes never move.',
          ko: '첫 줄은 문자열만 바뀐다: ci"loud. 괄호와 따옴표는 움직이지 않는다.',
        },
        {
          en: 'The second line changes the whole object: ci{open. You are inside the string, but the string is not what this line needs.',
          ko: '둘째 줄은 객체 전체가 바뀐다: ci{open. 문자열 안에 서 있지만, 이 줄이 원하는 것은 문자열이 아니다.',
        },
        {
          en: 'What remains is {vow: "loud"} and {open}, each inside its own <pre>.',
          ko: '남아야 하는 것은 {vow: "loud"}와 {open}, 각자의 <pre> 안에.',
        },
      ],
    },
  ],
};
