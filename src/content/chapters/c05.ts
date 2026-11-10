import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 5 — THE HALL OF MIRRORS
 *
 * Teaches: v V <C-v>, block I/A, >, J gJ, and the habit of pointing before editing.
 * Design notes:
 *  - Visual mode is about *seeing the range first*. Every stage asks the
 *    player to make the many-selves shape visible before it changes.
 *  - Stage 3 is the wow beat: one block insert writes // on four rows at once.
 *  - The boss recombines join + case + block edge work on a ledger.
 */
export const c05: Chapter = {
  id: 'c05',
  index: 5,
  title: { en: 'PANES', ko: '팬' },
  subtitle: { en: 'hall of mirrors', ko: '거울의 회랑' },
  story: {
    en: 'The fifth floor is all glass. Every mirror holds a cursor like yours, waiting for a hand to point. Here you stop editing one letter at a time — you choose many, then speak once.',
    ko: '다섯 번째 층은 온통 유리다. 거울마다 너를 닮은 커서가 하나씩 서서, 가리키는 손을 기다린다. 이제 글자 하나씩 고치지 않는다. 여럿을 고르고, 한 번에 말한다.',
  },
  sigil: '▥',
  hue: 130,
  unlocks: ['v', 'V', '<C-v>', '>', '<', 'J', 'g'],
  stages: [
    {
      id: 'c05s1',
      name: { en: 'The First Mirror', ko: '첫 거울' },
      brief: {
        en: 'The glass repeats one sentence too many. Do not cut blind.\n\nSweep the false half until it glows, then let go.',
        ko: '유리가 문장을 한 번 더 되풀이한다. 눈 감고 자르지 마라.\n\n거짓인 절반을 빛나게 훑은 뒤, 놓아라.',
      },
      whisper: { en: 'Nothing is cut until you can see it.', ko: '보이기 전에는 아무것도 잘리지 않는다.' },
      startChar: '',
      text: `@In the glass: one self and one self too many`,
      goal: { type: 'exact', text: 'In the glass: one self' },
      par: 5,
      solution: '6wv$d',
      teaches: ['v'],
      hints: [
        { en: 'w leaps word by word. Six leaps put you on and.', ko: 'w는 단어마다 뛴다. 여섯 번이면 and 위에 선다.' },
        { en: 'v opens the selection, $ stretches it to the end, d cuts exactly what glows.', ko: 'v로 선택을 열고, $로 끝까지 늘린 뒤, d로 빛나는 것만 자른다.' },
      ],
    },
    {
      id: 'c05s2',
      name: { en: 'A Wall of Selves', ko: '거울벽' },
      brief: {
        en: 'A wall of reflections leans the wrong way. You could push each line by hand —\n\nor hold them all with V, and move the wall once with >.',
        ko: '거울벽이 엉뚱한 쪽으로 기울었다. 한 줄씩 손으로 밀어도 된다.\n\n하지만 V로 모두 붙잡고, > 하나로 벽을 밀 수 있다.',
      },
      whisper: { en: 'One hand can lift a wall, if it holds the whole wall.', ko: '벽 전체를 붙잡은 손은 벽 하나를 들어 올린다.' },
      startChar: '',
      text: `@function reflect(x) {
let a = x;
let b = a;
return b;
}`,
      goal: {
        type: 'exact',
        text: `function reflect(x) {
  let a = x;
  let b = a;
  return b;
}`,
      },
      par: 5,
      solution: 'jV2j>',
      teaches: ['V', '>'],
      hints: [
        { en: 'V selects whole lines. j pulls the next line into the block.', ko: 'V는 줄 전체를 선택한다. j를 누르면 다음 줄이 블록에 더해진다.' },
        { en: 'j V 2j > — five keys, three lines moving together.', ko: 'j V 2j > — 다섯 번의 키로 세 줄이 함께 움직인다.' },
      ],
    },
    {
      id: 'c05s3',
      name: { en: 'The Column', ko: '기둥' },
      brief: {
        en: 'The first reflection is already marked. Its four sisters are not.\n\nOne stroke can give them all the same mark.',
        ko: '첫 반영에는 이미 표식이 있다. 나머지 넷에는 없다.\n\n한 번의 붓질이 모두에게 같은 표식을 준다.',
      },
      whisper: { en: 'Write once. Watch the others answer.', ko: '한 번 쓰면, 나머지가 대답한다.' },
      startChar: '',
      text: `// mirror 0
@mirror 2
mirror 4
mirror 6
mirror 8`,
      goal: {
        type: 'exact',
        text: `// mirror 0
// mirror 2
// mirror 4
// mirror 6
// mirror 8`,
      },
      par: 8,
      solution: '<C-v>3jI// <Esc>',
      teaches: ['C-v'],
      hints: [
        { en: 'Ctrl-V starts a rectangular selection: one column wide, as many lines as you pull.', ko: 'Ctrl-V는 사각형 선택을 연다. 한 칸 폭으로, 당기는 만큼 여러 줄.' },
        { en: 'From the first column of mirror 2, Ctrl-V 3j takes all four unmarked rows. I writes at the left edge of every line: type // then a space, and Esc.', ko: 'mirror 2의 첫 칸에서 Ctrl-V 3j면 표식 없는 네 줄이 모두 블록에 들어온다. I는 모든 줄의 왼쪽 끝에서 입력을 연다. //와 공백을 쓰고 Esc.' },
      ],
    },
    {
      id: 'c05s4',
      name: { en: 'Seams', ko: '이음매' },
      brief: {
        en: 'The mirror broke along two seams. J closes a seam with a breath of space;\n\ngJ closes it with nothing at all.',
        ko: '거울이 두 곳에서 깨졌다. J는 이음매에 숨 한 번의 공백을 넣고,\n\ngJ는 아무것도 넣지 않는다.',
      },
      whisper: { en: 'A seam is a choice: air, or no air.', ko: '이음매는 선택이다. 숨을 넣거나, 넣지 않거나.' },
      startChar: '',
      text: `@the glass
remembers
your name
/hall/of
mirrors`,
      goal: {
        type: 'exact',
        text: `the glass remembers your name
/hall/ofmirrors`,
      },
      par: 5,
      solution: 'JJjgJ',
      teaches: ['J', 'gJ'],
      hints: [
        { en: 'J joins this line with the next, adding one space. Two Js rebuild the broken sentence.', ko: 'J는 이 줄과 다음 줄을 공백 하나로 잇는다. J 두 번이면 깨진 문장이 돌아온다.' },
        { en: 'gJ joins without a space. The path is one name; it must not gain one.', ko: 'gJ는 공백 없이 잇는다. 그 경로는 하나의 이름이니, 사이에 무엇도 들어가면 안 된다.' },
      ],
    },
    {
      id: 'c05s5',
      name: { en: 'The Ledger', ko: '장부' },
      brief: {
        en: 'The ledger of every self is still unsealed. Join its broken title, shout it once with ~,\n\nthen seal all three rows in a single stroke.',
        ko: '모든 나의 장부가 아직 봉인되지 않았다. 깨진 제목을 잇고, ~로 한 번 외친 뒤,\n\n한 번의 붓질로 세 줄을 봉하라.',
      },
      whisper: { en: 'Many selves, one signature.', ko: '수많은 나, 하나의 서명.' },
      startChar: '',
      text: `@mirror
ledger
aria    2
boro    4
cato    6`,
      goal: {
        type: 'exact',
        text: `MIRROR LEDGER
aria    2 |
boro    4 |
cato    6 |`,
      },
      par: 14,
      solution: 'J013~j$<C-v>2jA |<Esc>',
      teaches: [],
      hints: [
        { en: 'J joins the broken title. Then 0 takes you to the line start and 13~ flips the whole line to shouting.', ko: 'J로 깨진 제목을 잇는다. 그다음 0으로 줄 앞에 가서 13~, 줄 전체를 고함으로 뒤집는다.' },
        { en: 'On the right edge of the first ledger row, Ctrl-V 2j takes the column; A adds | to all three rows at once.', ko: '첫 장부 줄의 오른쪽 끝에서 Ctrl-V 2j로 열을 잡고, A로 세 줄에 |를 한 번에 붙인다.' },
      ],
    },
  ],
};
