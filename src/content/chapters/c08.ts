import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 8 — MARKS & JUMPS
 *
 * Teaches: m, ' `, %, { }, ( ), <C-o> / <C-i>.
 * Design notes:
 *  - The machine's memory map is bigger than the screen: every stage is won
 *    by a jump into it, never by walking the page row by row.
 *  - s1 makes 'a (line) the winning key while `a (column) is one key away, so
 *    the difference is felt instead of read.
 *  - s2 is a two-key haiku: % closes the object, $ takes the width.
 *  - s3 swaps the lights for * so that only ) can land on the mid-line one
 *    (`*` is gated, so there is no f*), then } } { come back for the block.
 *  - s4 lets <C-o> land on the light you started on; s5 recombines pin + % + {.
 *  - Engine note: no ghost needs <C-i> or ( . `jumpForward` is currently
 *    unreachable (jumpIndex always sits at jumps.length - 1) and `(` only
 *    finds a sentence end when the punctuation is preceded by a space.
 *    Both are described in the s3/s4 whispers, never used by a ghost.
 */
export const c08: Chapter = {
  id: 'c08',
  index: 8,
  title: { en: 'Marks & Jumps', ko: '지도' },
  subtitle: { en: 'The Labyrinth Below', ko: '아래의 미궁' },
  story: {
    en: 'The memory map is longer than the screen. Marks are pins in it; jumps are the trail of addresses already spent. You do not have to walk the map. You only have to remember it.',
    ko: '기억 지도는 화면보다 길다. 마크는 그 위의 핀이고, 점프는 이미 지나온 주소들의 흔적이다. 지도를 걸을 필요는 없다. 기억하면 된다.',
  },
  sigil: '⌖',
  hue: 162,
  unlocks: ['m', '`', "'", '<C-o>', '<C-i>', '%', '{', '}', '(', ')'],
  stages: [
    {
      id: 'c08s1',
      name: { en: 'Pins', ko: '핀' },
      brief: {
        en: 'The north gate is at the top of the map and the last light is at the bottom. Walking back costs more than walking there.\n\nSo leave a pin. The machine keeps addresses; you do not have to.',
        ko: '지도 맨 위에 북쪽 문, 맨 아래에 마지막 빛이 있다. 돌아오는 길은 가는 길보다 비싸다.\n\n그러니 핀을 꽂아라. 기계가 주소를 기억하면 너는 기억하지 않아도 된다.',
      },
      whisper: {
        en: 'A pin costs two keys. The walk back costs the page.',
        ko: '핀은 두 개의 키. 되돌아 걷는 데는 페이지 전체가 든다.',
      },
      text: `$ mount@map.north --sectors
  sector 0x01: ok
  sector 0x02: ok
  sector 0x03: read error
  sector 0x04: ok
  sector 0x05: ok
  sector 0x06: read error
  sector 0x07: ok
  sector 0x08: ok
  sector 0x09: ok
  sector 0x0A: read error
  sector 0x0B: ok
  sector 0x0C: ok
  end of map. last light at 0x0D: $`,
      goal: { type: 'collect', char: '$' },
      par: 8,
      solution: "ma13j$'a",
      teaches: ['m', "'"],
      hints: [
        {
          en: 'm then a drops a pin on this address. The map keeps it.',
          ko: 'm 다음 a — 지금 주소에 핀을 꽂는다. 지도가 그것을 기억한다.',
        },
        {
          en: "'a returns to the pinned line at its first word — the prompt. `a would return to the exact byte you left.",
          ko: "'a 는 핀이 꽂힌 줄의 첫 글자, 곧 프롬프트로 돌아간다. `a 는 네가 떠난 바로 그 칸으로 돌아간다.",
        },
      ],
    },
    {
      id: 'c08s2',
      name: { en: 'The Far Brace', ko: '반대편 괄호' },
      brief: {
        en: 'A map object, ten lines deep, closed by a single brace. The light sits past its far end.\n\n% knows where a brace closes. It has always known.',
        ko: '열 줄짜리 지도 객체. 괄호 하나로 닫혀 있다. 빛은 그 먼 끝 너머에 있다.\n\n%는 괄호가 어디서 닫히는지 안다. 처음부터 알고 있었다.',
      },
      whisper: {
        en: 'The wall has two ends. One key knows both.',
        ko: '벽에는 두 끝이 있다. 한 번의 키가 둘 다 안다.',
      },
      text: `@ {  map: "north"
     gate: "sealed"
     wings: {
       north: { sector: 7 }
       south: { sector: 9 }
       east:  { sector: 3 }
       west:  { sector: 1 }
     }
     core: { sector: 0 }
     well: { depth: "unknown" }
  }  -- end of map. the light is out here: *`,
      goal: { type: 'reach', char: '*' },
      par: 2,
      solution: '%$',
      teaches: ['%'],
      hints: [
        {
          en: '% jumps from a brace to the one that closes it, however many lines away.',
          ko: '%는 눈앞의 괄호에서 그 괄호를 닫는 괄호로 뛴다. 몇 줄이 떨어져 있든.',
        },
        {
          en: 'The map closes ten lines down. Then $ takes the width in one more key.',
          ko: '지도는 열 줄 아래에서 닫힌다. 그다음 $가 한 번의 키로 너비를 가져간다.',
        },
      ],
    },
    {
      id: 'c08s3',
      name: { en: 'Log Blocks', ko: '로그 블록' },
      brief: {
        en: 'Four log blocks. One light waits on the first letter of a sentence; the far one is the first byte of a block.\n\nSentences are steps. Blocks are rooms.',
        ko: '네 개의 로그 블록. 빛 하나는 어떤 문장의 첫 글자에, 먼 빛은 어떤 블록의 첫 자리에 있다.\n\n문장은 걸음이고, 블록은 방이다.',
      },
      whisper: {
        en: 'Sentences are steps: ) forward, ( back. Blocks are rooms: } down, { up.',
        ko: '문장은 걸음이다. )는 앞으로, (는 뒤로. 블록은 방이다. }는 아래로, {는 위로.',
      },
      text: `@block 0: the wall is solid. no port here.
no window either. the block is a stub.

block 1: the cache is cold. * it says the
well runs deeper than the page.

* block 2: the door is a jump. it opens
only on the address you were about to read.

block 3: missing. someone
moved it. the wall is where it hung.`,
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
          en: '} falls to the blank line at the end of a block; { climbs back to the first line of the one above.',
          ko: '}는 블록 끝의 빈 줄로 떨어지고, {는 위 블록의 첫 줄로 올라간다.',
        },
      ],
    },
    {
      id: 'c08s4',
      name: { en: 'The Trail', ko: '흔적' },
      brief: {
        en: 'You begin on a light. It will not count until you come back to it.\n\nJump twice down the log, take the far light, and let the trail carry you home.',
        ko: '빛 위에서 시작한다. 돌아오기 전까지 그 빛은 세어지지 않는다.\n\n로그 아래로 두 번 뛰고, 멀리 있는 빛을 가져라. 그리고 흔적이 너를 집으로 데려가게 두라.',
      },
      whisper: {
        en: '<C-o> walks the trail backwards. <C-i> walks it forward again.',
        ko: '<C-o> 는 흔적을 거꾸로 걷는다. <C-i> 는 같은 길을 앞으로 다시 걷는다.',
      },
      startChar: '$',
      text: `@ trace 0: the trail begins here.
every jump you make is logged.
the log keeps them in the order you spent them.

trace 1: the sector is dry.
nothing was ever written here.

$ trace 2: the buffer is full.
it has been full since the first boot.

trace 3: the page goes on.
trace 4 is the one you cannot see yet.`,
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
        en: 'The lower map: braces for walls, blank lines for rooms, three lights.\n\nPin the gate, jump the wall, climb a block — then let the pin bring you home.',
        ko: '아래의 지도. 벽은 괄호, 방은 빈 줄, 빛은 셋.\n\n문에 핀을 꽂고, 벽을 뛰어넘고, 블록을 올라간 뒤, 핀이 너를 집으로 데려가게 하라.',
      },
      whisper: {
        en: 'Everything you learned, in one route. Nothing walks.',
        ko: '배운 것 전부가 한 길에. 걷는 것은 없다.',
      },
      text: `      $ gate: entry point. you stand five@bytes in.
        every wall a brace, every room a blank line.

$  {  node 1: the wall
      {  node 2: the inner room
         [ sector 7 ]
      }
   }  -- the wall ends. the light past it: $

the map folds back on itself here.
the light is the one you kept in your pocket.`,
      goal: { type: 'collect', char: '$' },
      par: 7,
      solution: "ma%${'a",
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
