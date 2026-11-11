import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 1 — BOOT
 *
 * Teaches: h j k l, 0 $, x, i a A o O, Esc, u.
 * The fiction: a machine comes up in pieces. You are the cursor. Every stage is
 * a piece of memory or a line of code that has to be made valid again.
 */
export const c01: Chapter = {
  id: 'c01',
  index: 1,
  title: { en: 'BOOT', ko: '부팅' },
  subtitle: { en: 'sector 0x00', ko: '섹터 0x00' },
  story: {
    en: 'The machine boots in pieces: 1024 lines of memory, three of them corrupt. A cursor blinks where your body should be. Nothing else moves here.',
    ko: '기계가 조각난 채로 부팅된다. 1024줄의 메모리, 그중 세 줄이 손상됐다. 몸이 있어야 할 자리에서 커서가 깜빡인다. 여기서 움직이는 것은 너뿐이다.',
  },
  sigil: '0x',
  hue: 130,
  unlocks: ['h', 'j', 'k', 'l', '0', '$', 'x', 'X', 'i', 'a', 'I', 'A', 'o', 'O'],
  stages: [
    {
      id: 'c01s1',
      name: { en: 'FIRST BYTE', ko: '첫 바이트' },
      brief: {
        en: 'Sector 0x00 is uninitialised. The marker * is the first byte the machine still trusts.\n\nWalk to it: h j k l.',
        ko: '섹터 0x00은 초기화되지 않았다. * 표식은 기계가 아직 믿는 첫 바이트다.\n\n걸어가라: h j k l.',
      },
      whisper: { en: 'h j k l — left, down, up, right.', ko: 'h j k l — 왼쪽, 아래, 위, 오른쪽.' },
      startChar: '.',
      text: `+------------+
|............|
|..@.........|
|............|
|.........*..|
+------------+`,
      goal: { type: 'reach', char: '*' },
      par: 9,
      solution: 'llllllljj',
      teaches: ['h', 'j', 'k', 'l'],
      hints: [
        { en: 'h left, l right, j down, k up.', ko: 'h 왼쪽, l 오른쪽, j 아래, k 위.' },
        { en: 'Seven steps right, then two down.', ko: '오른쪽으로 일곱 번, 아래로 두 번.' },
      ],
    },
    {
      id: 'c01s2',
      name: { en: 'ADDRESS SPACE', ko: '주소 공간' },
      brief: {
        en: 'The address space is long. Your patience is not.\n\nA number before a motion repeats it.',
        ko: '주소 공간은 길다. 인내심은 짧다.\n\n명령 앞에 숫자를 붙이면 그만큼 반복된다.',
      },
      text: `+--------------+
|@.............|
|..............|
|..............|
|..............|
|..............|
|.............*|
+--------------+`,
      goal: { type: 'reach', char: '*' },
      par: 5,
      solution: '13l5j',
      teaches: ['count'],
      hints: [
        { en: '13l is thirteen steps in two keystrokes.', ko: '13l은 두 번의 키로 열세 걸음.' },
        { en: '13l then 5j.', ko: '13l 그리고 5j.' },
      ],
    },
    {
      id: 'c01s3',
      name: { en: 'BIT ROT', ko: '비트 부패' },
      brief: {
        en: 'Seven bytes in this page have rotted into noise. The reader will not cross them.\n\nx cuts the byte under the cursor. A count works here too.',
        ko: '이 페이지의 일곱 바이트가 노이즈로 썩었다. 리더는 그 위를 지나가지 않는다.\n\nx는 커서 아래 바이트를 잘라낸다. 여기에도 숫자가 통한다.',
      },
      text: `+---------------+
|..@~~~~~~~....*|
|...............|
+---------------+`,
      goal: { type: 'all', of: [{ type: 'none', chars: '~' }, { type: 'reach', char: '*' }] },
      par: 5,
      solution: 'l7x$h',
      hazard: '',
      teaches: ['x', '$'],
      hints: [
        { en: 'l puts you on the noise. 7x removes all seven bytes.', ko: 'l로 노이즈 위에 선다. 7x가 일곱 바이트를 한 번에 지운다.' },
        { en: 'After the noise is gone, $ jumps to the last column.', ko: '노이즈가 사라지면 $가 마지막 칸으로 간다.' },
      ],
    },
    {
      id: 'c01s4',
      name: { en: 'SYNTAX ERROR', ko: '문법 오류' },
      brief: {
        en: 'The build fails on two lines. One is missing an =, the other is missing its semicolon.\n\ni inserts before the cursor. a inserts after. A appends at the end of the line.',
        ko: '빌드가 두 줄에서 실패한다. 하나는 =가 빠졌고, 다른 하나는 세미콜론이 없다.\n\ni는 커서 앞에, a는 뒤에 입력한다. A는 줄 끝에 덧붙인다.',
      },
      text: `if (x = 1) {
print("boot ok")`,
      goal: { type: 'exact', text: `if (x == 1) {\nprint("boot ok");` },
      par: 9,
      solution: '6la=<Esc>jA;<Esc>',
      teaches: ['i', 'a', 'A', 'esc'],
      hints: [
        { en: '6l stands on the =. a= adds the second = after it.', ko: '6l로 = 위에 선다. a=가 그 뒤에 두 번째 =를 넣는다.' },
        { en: 'Then j to the next line, and A; to close the statement.', ko: '그다음 j로 다음 줄, A;로 문장을 닫는다.' },
      ],
    },
    {
      id: 'c01s5',
      name: { en: 'HANDOFF', ko: '핸드오프' },
      brief: {
        en: 'The boot call was never given an argument. The kernel expects listen(3000).\n\nThen step onto the marker and let the machine continue.',
        ko: '부팅 호출에 인자가 없다. 커널은 listen(3000)을 기대한다.\n\n그다음 표식 위에 올라서서 기계를 진행시켜라.',
      },
      text: `listen(????)
   *`,
      goal: { type: 'all', of: [{ type: 'exact', text: `listen(3000)\n   *` }, { type: 'reach', char: '*' }] },
      par: 11,
      solution: '7l4xi3000<Esc>j',
      teaches: ['u'],
      hints: [
        { en: '7l to the first ?, 4x to clear all four.', ko: '7l로 첫 ?에, 4x로 네 개를 지운다.' },
        { en: 'i3000 inserts the port, Esc leaves, j lands on the marker.', ko: 'i3000으로 포트를 넣고, Esc로 나와 j로 표식에.' },
      ],
    },
  ],
};
