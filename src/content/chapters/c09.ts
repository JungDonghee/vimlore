import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 9 — EX
 *
 * Teaches: ranges (`:1,3d`), `:m` / `:t`, `:sort` (+`u`, `!`),
 * `:normal` over a range, and the boss that recombines all three.
 *
 * Design notes:
 *  - The `:` key was granted in chapter 6, so this chapter unlocks nothing.
 *  - Everything here is an *address*: a line number, a pair of numbers, `%`.
 *    Buffers are 11–13 lines of log, table or config, so walking them by hand
 *    is the punishment and one command is the relief.
 *  - The fiction is a dead machine opened on the operating table; the buffers
 *    are the files still warm inside it.
 *  - No buffer contains `~`, so the default hazard never bites.
 */
export const c09: Chapter = {
  id: 'c09',
  index: 9,
  title: { en: 'EX', ko: '명령줄' },
  subtitle: { en: 'the operating table', ko: '수술대' },
  story: {
    en: 'The machine is open on the table, its files still warm. A voice from the speaker, flat as a checksum: "Do not walk the file. Address it."',
    ko: '기계가 수술대 위에 열려 있다. 파일은 아직 따뜻하다. 스피커에서 체크섬처럼 납작한 목소리가 흐른다. "파일을 걷지 마라. 주소를 불러라."',
  },
  sigil: '⌗',
  hue: 130,
  unlocks: [],
  stages: [
    // ------------------------------------------------------------------ s1
    {
      id: 'c09s1',
      name: { en: 'ADDRESS', ko: '주소' },
      brief: {
        en: 'A boot log, thirteen lines. The first three are noise the disk wrote over; three rows in the middle fail the checksum.\n\nCut both blocks by address. Two commands.',
        ko: '부팅 로그, 열세 줄. 첫 세 줄은 디스크가 덮어쓴 노이즈, 중간의 세 줄은 체크섬을 통과하지 못했다.\n\n두 블록을 주소로 잘라내라. 명령 두 번.',
      },
      text: `0x00@0x00 0x00 0x00 0x00
0x00 0x00 0x00 0x00 0x00
0x00 0x00 0x00 0x00 0x00
ID  NAME    STATE
??  ??????  ?????
??  ??????  ?????
??  ??????  ?????
01  boot    ok
02  mount   ok
03  net     ok
04  ledger  ok
05  vault   ok
06  cursor  ok`,
      goal: {
        type: 'exact',
        text: `ID  NAME    STATE
01  boot    ok
02  mount   ok
03  net     ok
04  ledger  ok
05  vault   ok
06  cursor  ok`,
      },
      par: 12,
      solution: ':1,3d<CR>:2,4d<CR>',
      teaches: [],
      hints: [
        {
          en: 'A colon opens the command line. A range is `first,last`: `:1,3d` deletes lines 1 to 3.',
          ko: '콜론이 명령줄을 연다. 범위는 `처음,끝`. `:1,3d`는 1~3번 줄을 지운다.',
        },
        {
          en: 'After the noise is gone the rows slide up. Count again: the failed rows are lines 2, 3 and 4.',
          ko: '노이즈가 사라지면 줄들이 위로 당겨진다. 다시 세라. 실패한 줄은 이제 2, 3, 4번이다.',
        },
      ],
      whisper: {
        en: 'Two addresses. The machine walks.',
        ko: '주소 둘. 걷는 건 기계다.',
      },
    },

    // ------------------------------------------------------------------ s2
    {
      id: 'c09s2',
      name: { en: 'THE FOLD', ko: '접힌 곳' },
      brief: {
        en: 'The run queue folds after job 04 — the header must be printed again at the fold. Job 09 is on hold; it belongs at the end of the queue.\n\nBoth commands file their line after the address you name.',
        ko: '실행 큐는 04번 작업 뒤에서 접힌다. 접힌 자리에 헤더가 다시 인쇄되어야 한다. 09번 작업은 보류다. 큐의 맨 끝으로 가야 한다.\n\n두 명령 모두, 지정한 주소 다음에 줄을 넣는다.',
      },
      text: `#@RUN QUEUE
09  reindex      hold
01  boot         ok
02  mount        ok
03  net          ok
04  ledger       ok
05  vault        ok
06  cursor       ok
07  buffer       ok
08  flush        ok
-- end of queue`,
      goal: {
        type: 'exact',
        text: `# RUN QUEUE
01  boot         ok
02  mount        ok
03  net          ok
04  ledger       ok
# RUN QUEUE
05  vault        ok
06  cursor       ok
07  buffer       ok
08  flush        ok
09  reindex      hold
-- end of queue`,
      },
      par: 11,
      solution: ':1t6<CR>:2m11<CR>',
      teaches: [':m', ':t'],
      hints: [
        {
          en: '`m` moves a line; `t` copies it. Both take an address: `:1t6` copies line 1 to after line 6.',
          ko: '`m`은 줄을 옮기고 `t`는 복사한다. 둘 다 주소를 받는다. `:1t6`은 1번 줄을 6번 줄 다음으로 복사한다.',
        },
        {
          en: 'Fold first: copy the header after job 04. Then job 08 is line 11 — file job 09 after it.',
          ko: '먼저 접어라. 헤더를 04번 작업 다음으로 복사한다. 그러면 08번 작업이 11번 줄이 된다. 09번 작업을 그 뒤로 옮긴다.',
        },
      ],
      whisper: {
        en: 'A copy stays. A move leaves.',
        ko: '복사는 남고, 이동은 떠난다.',
      },
    },

    // ------------------------------------------------------------------ s3
    {
      id: 'c09s3',
      name: { en: 'THE TABLE', ko: '표' },
      brief: {
        en: 'The linker wrote the symbol table twice, and shuffled both passes. Some symbols were registered twice.\n\nAlphabetical. One of each.',
        ko: '링커가 심볼 표를 두 번 썼고, 두 번 모두 뒤섞였다. 어떤 심볼은 두 번 등록됐다.\n\n알파벳순. 하나씩만.',
      },
      text: `cursor@ 0x3f
stack   0x10
heap    0x22
clock   0x08
bus     0x04
stack   0x10
cache   0x40
disk    0x80
log     0x1c
trace   0x2b
pipe    0x2a
mutex   0x0c
disk    0x80`,
      goal: {
        type: 'exact',
        text: `bus     0x04
cache   0x40
clock   0x08
cursor  0x3f
disk    0x80
heap    0x22
log     0x1c
mutex   0x0c
pipe    0x2a
stack   0x10
trace   0x2b`,
      },
      par: 8,
      solution: ':sort u<CR>',
      teaches: [':sort'],
      hints: [
        {
          en: '`:sort` orders the whole table at once — no range needed.',
          ko: '`:sort`는 표 전체를 한 번에 정렬한다. 범위도 필요 없다.',
        },
        {
          en: 'A flag follows the command. `u` keeps one of each duplicate: `:sort u`.',
          ko: '명령 뒤에 깃발이 붙는다. `u`는 겹친 줄을 하나만 남긴다. `:sort u`.',
        },
        {
          en: 'The other flag is `!` — `:sort!` reads the table backwards, for when the machine wants descending.',
          ko: '다른 깃발은 `!`. `:sort!`는 표를 거꾸로 읽는다. 기계가 내림차순을 원할 때 쓴다.',
        },
      ],
      whisper: {
        en: 'Sorted is findable.',
        ko: '정렬되면 찾을 수 있다.',
      },
    },

    // ------------------------------------------------------------------ s4
    {
      id: 'c09s4',
      name: { en: 'BATCH', ko: '일괄' },
      brief: {
        en: 'The machine reads a config line only when it ends in `;`. Twelve lines came back without one.\n\nSay it once. Let the page repeat it.',
        ko: '기계는 줄 끝에 `;`가 있어야 설정 줄을 읽는다. 열두 줄 모두 세미콜론 없이 돌아왔다.\n\n한 번만 말하라. 페이지가 따라 하게.',
      },
      text: `mode@     fast
threads   8
queue     64
retry     3
timeout   30
log       warn
cache     0x40
sector    7
cursor    0x3f
checksum  on
backup    nightly
uptime    0`,
      goal: {
        type: 'exact',
        text: `mode      fast;
threads   8;
queue     64;
retry     3;
timeout   30;
log       warn;
cache     0x40;
sector    7;
cursor    0x3f;
checksum  on;
backup    nightly;
uptime    0;`,
      },
      par: 12,
      solution: ':%normal A;<CR>',
      teaches: [':normal'],
      hints: [
        {
          en: '`:%normal` runs normal-mode keys on every line, from the top.',
          ko: '`:%normal`은 노멀 모드의 키를 모든 줄에서, 맨 위부터 실행한다.',
        },
        {
          en: 'The `;` belongs at the end of each line. `A` appends there: `:%normal A;`.',
          ko: '`;`는 각 줄 끝에 와야 한다. `A`가 그 자리에 덧붙인다. `:%normal A;`.',
        },
      ],
      whisper: {
        en: 'One line is typing. Twelve is a command.',
        ko: '한 줄은 타이핑, 열두 줄은 명령.',
      },
    },

    // ------------------------------------------------------------------ s5
    {
      id: 'c09s5',
      name: { en: 'SURGERY', ko: '수술' },
      brief: {
        en: 'The table came back numbered, shuffled, and joined with the old dash. Twelve records.\n\nNo numbers. Alphabetical. One colon between key and value.',
        ko: '표가 번호가 매겨지고 뒤섞인 채 돌아왔다. 옛 줄표로 이어져 있다. 열두 개의 레코드.\n\n번호는 없다. 알파벳순. 키와 값 사이에는 콜론 하나.',
      },
      text: `05@mutex - locked
02 cache - 0x40
09 stack - 0x10
01 bus - idle
07 clock - 0x08
03 log - warn
06 pipe - open
04 heap - 0x22
08 socket - closed
10 trace - off
11 sector - 7
12 cursor - 0x3f`,
      goal: {
        type: 'exact',
        text: `bus : idle
cache : 0x40
clock : 0x08
cursor : 0x3f
heap : 0x22
log : warn
mutex : locked
pipe : open
sector : 7
socket : closed
stack : 0x10
trace : off`,
      },
      par: 31,
      solution: ':%normal 3x<CR>:sort<CR>:%s/ - / : /<CR>',
      teaches: [],
      hints: [
        {
          en: 'Three passes: strip, sort, replace. Begin with the numbers — three characters on every line: `:%normal 3x`.',
          ko: '세 번: 번호를 자르고, 정렬하고, 바꾼다. 번호부터. 모든 줄의 세 글자: `:%normal 3x`.',
        },
        {
          en: 'The table is shuffled. `:sort` settles it.',
          ko: '표가 뒤섞여 있다. `:sort`가 정리한다.',
        },
        {
          en: 'Last, the dash becomes a colon: `:%s/ - / : /`.',
          ko: '마지막으로 줄표가 콜론이 된다: `:%s/ - / : /`.',
        },
      ],
      whisper: {
        en: 'Three passes. No fingerprints.',
        ko: '세 번 지나면 지문은 남지 않는다.',
      },
    },
  ],
};
