import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 8 — MARKS & JUMPS
 *
 * Teaches: m, ' `, %, { }, ( ), <C-o> / <C-i>.
 * Design notes:
 *  - The page is always bigger than the room: every stage is won by a jump,
 *    never by a walk.
 *  - s1 makes 'a (line) the winning key while `a (column) is one key away,
 *    so the difference is felt, not read.
 *  - s2 is a two-key haiku: % crosses the wall, $ crosses the width.
 *  - s3 makes ) and } the only way to land on the lights; s4 lets <C-o>
 *    land on the light you started on; s5 recombines pin + % + { .
 *  - Engine note: the ghost never needs <C-i> or ( . `jumpForward` is
 *    currently unreachable (jumpIndex always sits at jumps.length - 1) and
 *    `(` only finds a sentence end when the punctuation is preceded by a
 *    space. Both are taught in the s4/s3 whispers, not in the solutions.
 */
export const c08: Chapter = {
  id: 'c08',
  index: 8,
  title: { en: 'MARKS', ko: '마크' },
  subtitle: { en: 'the labyrinth', ko: '미궁' },
  story: {
    en: 'The stair ends at a page too wide to walk. In your hand a chart unfolds, blank until you stand still — then a pin of light marks the spot. The page below is a labyrinth. You do not have to walk it. You only have to remember it.',
    ko: '계단은 걸어서는 지나갈 수 없는 페이지에서 끝난다. 손안에서 지도가 펼쳐진다. 가만히 서 있으면 지도 위에 핀 하나가 빛난다. 아래의 페이지는 미궁이다. 걸을 필요는 없다. 기억하면 된다.',
  },
  sigil: '⌖',
  hue: 130,
  unlocks: ['m', '`', "'", '<C-o>', '<C-i>', '%', '{', '}', '(', ')'],
  stages: [
    {
      id: 'c08s1',
      name: { en: 'Pins', ko: '핀' },
      brief: {
        en: 'The north gate. The chart is longer than the room.\n\nWalk to the far light and you will have to walk back — so leave a pin where you stand, and let the chart hold it.',
        ko: '북쪽 문. 지도는 방보다 길다.\n\n저 멀리 빛까지 걸어가면 다시 걸어 돌아와야 한다. 그러니 서 있는 자리에 핀을 꽂아라. 지도가 그것을 붙들어 준다.',
      },
      whisper: {
        en: 'A pin costs two keys. The walk back costs everything.',
        ko: '핀은 두 번의 키. 되돌아 걷는 데는 모든 것이 든다.',
      },
      text: `    $ the north gate. you@unfold the chart here.
      the chart is longer than the room you are in.
      it goes south, and then it goes south again.

      past the salt well, where the rope is short.
      past the cistern that forgot its name.
      past the arch that leans on nothing at all.

      past the room where someone drew this map.
      past the stair that counts itself at night.
      past the door that only opens inward.
      and then the page runs out of ink.

      the last light waits at the end of the line. $`,
      goal: { type: 'collect', char: '$' },
      par: 8,
      solution: "ma13j$'a",
      teaches: ['m', "'"],
      hints: [
        {
          en: 'm then a drops a pin where you stand. The chart keeps it.',
          ko: 'm 다음 a — 서 있는 자리에 핀이 꽂힌다. 지도가 그것을 기억한다.',
        },
        {
          en: "'a returns to the pinned line, at its first word — that is where the gate's light sits. `a would return to the exact column you left.",
          ko: "'a 는 핀이 꽂힌 줄의 첫 글자로 돌아간다. 문의 빛이 바로 거기 있다. `a 는 네가 떠난 바로 그 칸으로 돌아간다.",
        },
      ],
    },
    {
      id: 'c08s2',
      name: { en: 'The Door in the Wall', ko: '벽 속의 문' },
      brief: {
        en: 'A wall of brackets, ten lines tall, and the light on the far side of it.\n\n% knows where a wall ends. It has always known.',
        ko: '괄호로 쌓은 벽이 열 줄. 빛은 그 반대편에 있다.\n\n%는 벽이 어디서 끝나는지 안다. 처음부터 알고 있었다.',
      },
      whisper: {
        en: 'The wall has two ends. One key knows both.',
        ko: '벽에는 두 끝이 있다. 한 번의 키가 둘 다 안다.',
      },
      text: `@  (  the north wall of the map
     twenty paces of ink and no door.
     (  the long gallery
        (  the cold room
           [ the well ]
           [ the water ]
        )
     )
     the wall bends where the ink runs thin.
     the wall bends again and forgets why.
  )  the wall ends. the light is past it, far out: *`,
      goal: { type: 'reach', char: '*' },
      par: 2,
      solution: '%$',
      teaches: ['%'],
      hints: [
        {
          en: '% jumps from a bracket to the one that matches it, however many lines away.',
          ko: '%는 눈앞의 괄호에서 짝이 맞는 괄호로 뛴다. 몇 줄이 떨어져 있든 상관없이.',
        },
        {
          en: 'The wall opens ten lines down. Then $ crosses the width in one more key.',
          ko: '벽은 열 줄 아래에서 열린다. 그다음 $가 한 번의 키로 너비를 건넌다.',
        },
      ],
    },
    {
      id: 'c08s3',
      name: { en: 'Inscriptions', ko: '새겨진 글' },
      brief: {
        en: 'Four inscriptions. The light waits at the start of a sentence; the far door is the first word of a paragraph.\n\nSentences are steps. Paragraphs are rooms.',
        ko: '네 개의 글이 새겨져 있다. 빛은 어떤 문장의 첫머리에, 먼 문은 어떤 문단의 첫머리에 있다.\n\n문장은 걸음이고, 문단은 방이다.',
      },
      whisper: {
        en: 'Do not count lines. Count thoughts.',
        ko: '줄을 세지 마라. 생각을 세라.',
      },
      text: `the@first inscription is a wall. it has no door.
no window either. it is mostly a rumour.

the second inscription is water. * it says the
well is deeper than the page. nobody checked.

* the third inscription is a door. it opens
only on the sentence you were about to read.

the fourth inscription is missing. someone
took it away. the wall is where it hung.`,
      goal: { type: 'collect', char: '*' },
      par: 8,
      solution: ')))))}}{',
      teaches: ['{', '}'],
      hints: [
        {
          en: ') steps to the first letter of the next sentence, even across a blank line.',
          ko: ')는 다음 문장의 첫 글자로 간다. 빈 줄을 건너서도.',
        },
        {
          en: '} falls to the blank line at the end of a paragraph; { climbs back to the first line of the one above.',
          ko: '}는 문단 끝의 빈 줄로 떨어지고, {는 위 문단의 첫 줄로 올라간다.',
        },
      ],
    },
    {
      id: 'c08s4',
      name: { en: 'The Trail', ko: '흔적' },
      brief: {
        en: 'You begin on a light. It will not count until you come back to it.\n\nLeap twice down the page, take the far light, and let the trail carry you home.',
        ko: '빛 위에서 시작한다. 돌아오기 전까지 그 빛은 세어지지 않는다.\n\n페이지 아래로 두 번 뛰고, 멀리 있는 빛을 가져라. 그리고 흔적이 너를 집으로 데려가게 두라.',
      },
      whisper: {
        en: '<C-o> walks the trail backwards. <C-i> walks it forward again.',
        ko: '<C-o> 는 흔적을 거꾸로 걷는다. <C-i> 는 같은 길을 앞으로 다시 걷는다.',
      },
      startChar: '$',
      text: `@ the trail begins here.
the page remembers every jump you make.
it keeps them in the order you spent them.

the second station. the ink is dry.
nothing was ever buried here.

$ the third station. the well is full.
it has been full for a hundred years.

the fourth station. the page goes on.
the fifth is the one you cannot see yet.`,
      goal: { type: 'collect', char: '$' },
      par: 4,
      solution: '}}j<C-o>',
      teaches: ['C-o'],
      hints: [
        {
          en: 'Two jumps first. Then <C-o> walks back along the trail those jumps left.',
          ko: '먼저 두 번 뛰어라. 그다음 <C-o> 가 그 점프들이 남긴 흔적을 거꾸로 걷는다.',
        },
        {
          en: 'The light under your feet at the start is still unlit. Come back to it last.',
          ko: '시작할 때 발밑에 있던 빛은 아직 꺼져 있다. 마지막에 그리로 돌아와라.',
        },
      ],
    },
    {
      id: 'c08s5',
      name: { en: 'The Labyrinth', ko: '미궁' },
      brief: {
        en: 'The lower maze: walls of brackets, rooms of paragraphs, three lights.\n\nPin the gate, leap the wall, climb the paragraph — then let the pin bring you home.',
        ko: '아래의 미궁. 괄호의 벽, 문단의 방, 세 개의 빛.\n\n문에 핀을 꽂고, 벽을 뛰어넘고, 문단을 올라간 뒤, 핀이 너를 집으로 데려가게 하라.',
      },
      whisper: {
        en: 'Everything you learned, in one route. Nothing walks.',
        ko: '배운 것 전부가 한 길에. 걷는 것은 없다.',
      },
      text: `      $ the gate. you stand five@steps inside it.
        a wall is a bracket, a room is a paragraph.

$  (  the first wall
      (  the inner room
         [ the well ]
      )
   )  the wall ends. the light past it: $

the wall is where the map folds back on itself.
the light past it is the one you kept in your pocket.`,
      goal: { type: 'collect', char: '$' },
      par: 8,
      solution: "ma}%${'a",
      teaches: [],
      hints: [
        {
          en: 'Three lights, three tools: a pin for home, % for the wall, { for the room.',
          ko: '세 개의 빛, 세 가지 도구. 집에는 핀, 벽에는 %, 방에는 {.',
        },
        {
          en: 'Pin the gate first, or the last jump has nowhere to land.',
          ko: '먼저 문에 핀을 꽂아라. 그러지 않으면 마지막 점프가 돌아갈 곳이 없다.',
        },
      ],
    },
  ],
};
