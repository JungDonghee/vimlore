import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 9 — COMMAND LINE
 *
 * Teaches: ranges (`:1,3d`), `:m` / `:t`, `:sort` (+`u`, `!`),
 * `:normal` over a range, and the boss that recombines all three.
 *
 * Design notes:
 *  - The `:` key was granted in chapter 6, so this chapter unlocks nothing.
 *  - Everything here is an *address*: a line number, a pair of numbers, `%`.
 *    The buffers are all 11–13 lines, so walking them by hand is the punishment
 *    and one command is the relief.
 *  - The ex parser in this build wants a space before an argument
 *    (`:1m 5`, `:sort !`), so the ghosts spell it that way.
 *  - No buffer contains `~`, so the default hazard never bites.
 */
export const c09: Chapter = {
  id: 'c09',
  index: 9,
  title: { en: 'EX', ko: '명령줄' },
  subtitle: { en: 'the operating table', ko: '수술대' },
  story: {
    en: 'A white-tiled theatre, lit like an altar. Under the lamp a ledger lies open, and a machine has been copying it all night — badly. The Matron does not look up. "Address the page," she says. "Do not walk it."',
    ko: '하얀 타일의 수술실. 제단처럼 불이 켜져 있다. 등불 아래 장부가 펼쳐져 있고, 기계가 밤새 그것을 베껴 왔다. 형편없이. 간호장은 고개도 들지 않는다. "주소로 말하라. 한 걸음씩 걷지 말고."',
  },
  sigil: '⌗',
  hue: 130,
  unlocks: [],
  stages: [
    // ------------------------------------------------------------------ s1
    {
      id: 'c09s1',
      name: { en: 'The Address', ko: '주소' },
      brief: {
        en: 'The night shift left the page in the sink. The first three lines are water and rust; three rows further down are eaten black.\n\nCut the stain away, then the dark. One command each.',
        ko: '야간 근무가 페이지를 물먹은 채 두고 갔다. 첫 세 줄은 물얼룩과 녹, 조금 더 아래 세 줄은 새까맣게 먹혔다.\n\n얼룩을 잘라내고, 그다음 어둠을. 각각 한 번의 명령으로.',
      },
      text: `STAINED@PAGE - NIGHT LEDGER
----------------------------
the ink ran here
ITEM        STATE
illegible   illegible
illegible   illegible
illegible   illegible
clamp       clean
thread      black
drain       clean
scissors    dull
tray        steel
apron       torn`,
      // `:d` changes `buf.lines` in place without refreshing the buffer's
      // cached flat text, so an `exact` goal would only ever see the first
      // cut. A line goal reads the live lines; the trailing '' sentinel
      // makes sure nothing survives below the last row.
      goal: {
        type: 'lines',
        from: 1,
        lines: [
          'ITEM        STATE',
          'clamp       clean',
          'thread      black',
          'drain       clean',
          'scissors    dull',
          'tray        steel',
          'apron       torn',
          '',
        ],
      },
      par: 12,
      solution: ':1,3d<CR>:2,4d<CR>',
      teaches: [],
      hints: [
        {
          en: 'A colon opens the command line. A range is written `first,last`: `:1,3d` deletes lines 1 to 3.',
          ko: '콜론이 명령줄을 연다. 범위는 `처음,끝`으로 쓴다. `:1,3d`는 1~3번 줄을 지운다.',
        },
        {
          en: 'After the stain is gone the rows slide up. Count again: the eaten ones are now lines 2, 3 and 4.',
          ko: '얼룩이 사라지면 줄들이 위로 당겨진다. 다시 세라. 먹힌 줄은 이제 2, 3, 4번이다.',
        },
      ],
      whisper: {
        en: 'A range is two addresses and the seam between them.',
        ko: '범위는 두 개의 주소와 그 사이의 솔기다.',
      },
    },

    // ------------------------------------------------------------------ s2
    {
      id: 'c09s2',
      name: { en: 'The Fold', ko: '접힌 곳' },
      brief: {
        en: 'The sheet folds after CASE 04 — the title must be written again at the fold. And CASE 09 is a hold, not a case; it belongs at the back of the list.\n\nBoth commands file their line after the address you name.',
        ko: '장부는 CASE 04 뒤에서 접힌다. 접힌 자리에 제목이 다시 적혀야 한다. 그리고 CASE 09는 수술이 아니라 대기다. 목록 맨 뒤로 가야 한다.\n\n두 명령 모두, 지정한 주소 다음에 줄을 넣는다.',
      },
      text: `THEATRE@THREE - NIGHT LIST
CASE 09  port repair     hold
CASE 01  appendix        ward 2
CASE 02  biopsy          ward 4
CASE 03  fracture        ward 1
CASE 04  drains          ward 5
CASE 05  suture          ward 6
CASE 06  xray            ward 7
CASE 07  stitches        ward 3
CASE 08  tonsils         ward 2
shift ends 06:00`,
      goal: {
        type: 'exact',
        text: `THEATRE THREE - NIGHT LIST
CASE 01  appendix        ward 2
CASE 02  biopsy          ward 4
CASE 03  fracture        ward 1
CASE 04  drains          ward 5
THEATRE THREE - NIGHT LIST
CASE 05  suture          ward 6
CASE 06  xray            ward 7
CASE 07  stitches        ward 3
CASE 08  tonsils         ward 2
CASE 09  port repair     hold
shift ends 06:00`,
      },
      par: 13,
      solution: ':1t 6<CR>:2m 11<CR>',
      teaches: [':m', ':t'],
      hints: [
        {
          en: '`m` moves a line; `t` copies it. Both take an address after them: `:1t 6` copies line 1 to after line 6.',
          ko: '`m`은 줄을 옮기고 `t`는 복사한다. 둘 다 뒤에 주소를 받는다. `:1t 6`은 1번 줄을 6번 줄 다음으로 복사한다.',
        },
        {
          en: 'Fold first: copy the title after CASE 04. Then CASE 08 is line 11 — file CASE 09 after it.',
          ko: '먼저 접어라. 제목을 CASE 04 다음으로 복사한다. 그러면 CASE 08이 11번 줄이 된다. CASE 09를 그 뒤로 옮긴다.',
        },
      ],
      whisper: {
        en: 'Moving is not cutting. The line is not lost; it is filed.',
        ko: '옮기는 것은 자르는 게 아니다. 줄은 사라지지 않는다. 제자리를 찾을 뿐이다.',
      },
    },

    // ------------------------------------------------------------------ s3
    {
      id: 'c09s3',
      name: { en: 'The Tray', ko: '쟁반' },
      brief: {
        en: 'Two hands wrote the tray list, and both were tired. The names are shuffled, and some were written twice.\n\nAlphabetical. Each name once.',
        ko: '두 손이 쟁반 목록을 적었고, 둘 다 지쳐 있었다. 이름은 뒤섞였고, 몇 개는 두 번 적혔다.\n\n가나다순으로. 이름마다 한 번씩.',
      },
      text: `scalpel@    clean
gauze       clean
clamp       rusted
drain       clean
forceps     bent
lamp        dim
needle      bent
suture      fine
thread      black
gauze       clean
tray        steel
mask        clean
tray        steel`,
      goal: {
        type: 'exact',
        text: `clamp       rusted
drain       clean
forceps     bent
gauze       clean
lamp        dim
mask        clean
needle      bent
scalpel     clean
suture      fine
thread      black
tray        steel`,
      },
      par: 8,
      solution: ':sort u<CR>',
      teaches: [':sort'],
      hints: [
        {
          en: '`:sort` orders the whole page at once — no range needed.',
          ko: '`:sort`는 페이지 전체를 한 번에 정렬한다. 범위도 필요 없다.',
        },
        {
          en: 'A flag follows the command. `u` keeps one of each duplicate: `:sort u`.',
          ko: '명령 뒤에 깃발이 붙는다. `u`는 겹친 줄을 하나만 남긴다. `:sort u`.',
        },
        {
          en: 'The other flag is `!` — `:sort !` reads the whole list backwards, for when the night asks for descending.',
          ko: '다른 깃발은 `!`. `:sort !`는 목록을 거꾸로 읽는다. 밤이 내림차순을 원할 때 쓴다.',
        },
      ],
      whisper: {
        en: 'Order is a kind of mercy.',
        ko: '질서도 일종의 자비다.',
      },
    },

    // ------------------------------------------------------------------ s4
    {
      id: 'c09s4',
      name: { en: 'All At Once', ko: '한 번에' },
      brief: {
        en: "The clerk's machine left a comma at the end of every row. Twelve rows. Your finger already knows how long that takes.\n\nSay it once. Let the page repeat it.",
        ko: '서기의 기계가 모든 줄 끝에 쉼표를 남겼다. 열두 줄. 손가락이 이미 안다. 얼마나 오래 걸리는지.\n\n한 번만 말하라. 페이지가 따라 하게.',
      },
      text: `CASE@01  appendix        ward 2,
CASE 02  biopsy          ward 4,
CASE 03  fracture        ward 1,
CASE 04  drains          ward 5,
CASE 05  suture          ward 6,
CASE 06  xray            ward 7,
CASE 07  stitches        ward 3,
CASE 08  tonsils         ward 2,
CASE 09  port repair     hold,
CASE 10  gall bladder    ward 9,
CASE 11  knee            ward 8,
CASE 12  wrist           ward 6,`,
      goal: {
        type: 'exact',
        text: `CASE 01  appendix        ward 2
CASE 02  biopsy          ward 4
CASE 03  fracture        ward 1
CASE 04  drains          ward 5
CASE 05  suture          ward 6
CASE 06  xray            ward 7
CASE 07  stitches        ward 3
CASE 08  tonsils         ward 2
CASE 09  port repair     hold
CASE 10  gall bladder    ward 9
CASE 11  knee            ward 8
CASE 12  wrist           ward 6`,
      },
      par: 12,
      solution: ':%normal $x<CR>',
      teaches: [':normal'],
      hints: [
        {
          en: '`:%normal` runs normal-mode keys on every line, from the top of the page.',
          ko: '`:%normal`은 노멀 모드의 키를 모든 줄에서, 맨 위부터 실행한다.',
        },
        {
          en: 'The comma is the last character of each row. `$x` takes the last character: `:%normal $x`.',
          ko: '쉼표는 각 줄의 마지막 글자다. `$x`가 마지막 글자를 가져간다. `:%normal $x`.',
        },
      ],
      whisper: {
        en: 'One line is a chore. Twelve is a spell.',
        ko: '한 줄은 잔일이고, 열두 줄은 주문이다.',
      },
    },

    // ------------------------------------------------------------------ s5
    {
      id: 'c09s5',
      name: { en: 'Surgery', ko: '수술' },
      brief: {
        en: 'The top page is gone; only the rows remain. A machine numbered them, shuffled them, and joined each item to its state with the old dash.\n\nNo numbers. Alphabetical. A colon between item and state.',
        ko: '맨 윗장은 사라지고 줄만 남았다. 기계가 번호를 매기고, 뒤섞고, 항목과 상태를 옛 줄표로 이어 놓았다.\n\n번호는 없다. 가나다순. 항목과 상태 사이에는 콜론.',
      },
      text: `05@scalpel - sharp
02 gauze - clean
09 suture - fine
01 tray - steel
07 clamp - rusted
03 lamp - dim
06 thread - black
04 forceps - bent
08 drain - clean
10 scissors - dull
11 apron - torn
12 mask - clean`,
      goal: {
        type: 'exact',
        text: `apron : torn
clamp : rusted
drain : clean
forceps : bent
gauze : clean
lamp : dim
mask : clean
scalpel : sharp
scissors : dull
suture : fine
thread : black
tray : steel`,
      },
      par: 31,
      solution: ':%normal 3x<CR>:sort<CR>:%s/ - / : /<CR>',
      teaches: [],
      hints: [
        {
          en: 'Three passes: strip, sort, replace. Begin with the numbers — three characters on every row: `:%normal 3x`.',
          ko: '세 번: 번호를 자르고, 정렬하고, 바꾼다. 번호부터. 모든 줄의 세 글자: `:%normal 3x`.',
        },
        {
          en: 'The list is shuffled. `:sort` settles it.',
          ko: '목록이 뒤섞여 있다. `:sort`가 정리한다.',
        },
        {
          en: 'Last, the dash becomes a colon: `:%s/ - / : /`.',
          ko: '마지막으로 줄표가 콜론이 된다: `:%s/ - / : /`.',
        },
      ],
      whisper: {
        en: 'Three passes. Then the page is quiet.',
        ko: '세 번 지나면, 페이지는 조용해진다.',
      },
    },
  ],
};
