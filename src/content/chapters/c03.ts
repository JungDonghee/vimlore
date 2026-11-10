import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 3 — OPERATORS
 *
 * Teaches: d c y (the verbs), dd 3dd, cw s S, yy p P, and dot-repeat.
 * Design notes:
 *  - Every stage is built so the operator is *shorter* than the character
 *    surgery it replaces: dw over five rots, 3dd over three lines, yyp over
 *    retyping a verse, . over repeating the same cut five times.
 *  - `startChar` carries the character hidden under the @, so the player
 *    begins exactly on the word the stage is about and the grid never shifts.
 *  - No hazards here. Chapter 3 is grammar, not precision; the lesson is the
 *    shape of the sentence (verb + noun), not the aim.
 */
export const c03: Chapter = {
  id: 'c03',
  index: 3,
  title: { en: 'OPERATORS', ko: '연산자' },
  subtitle: { en: 'the forge', ko: '대장간' },
  story: {
    en: 'Where the word-fields end, a forge still stands warm. On its wall hang three iron letters — d, c, y — and none of them moves alone. Each is a verb waiting for a noun.',
    ko: '단어의 들판이 끝나는 곳에 대장간이 있다. 망치는 아직 따뜻하고, 벽에는 쇠글자 d, c, y가 걸려 있다. 저마다 혼자서는 움직이지 않는다 — 명사를 기다리는 동사다.',
  },
  sigil: '▞',
  hue: 130,
  unlocks: ['d', 'c', 'y', 'p', 'P', '.', 's', 'S', 'D', 'C'],
  stages: [
    {
      id: 'c03s1',
      name: { en: 'Pruning', ko: '가지치기' },
      brief: {
        en: 'The field behind the forge is overgrown with rot. Every word that reads ROT has to come out, root and all.\n\nPress d and the world holds its breath: a verb with no noun yet.',
        ko: '대장간 뒤편 들판이 부패로 뒤덮였다. ROT이라 적힌 말은 뿌리째 뽑아야 한다.\n\nd를 누르면 세계가 숨을 멈춘다 — 아직 명사가 없는 동사 하나.',
      },
      whisper: { en: 'd w — delete to the next word. d e — delete to the end of a word.', ko: 'd w — 다음 단어까지 지운다. d e — 단어 끝까지 지운다.' },
      startChar: 'R',
      text: `@OT ash ROT ember
ROT smoke ROT frost
salt and ROT cinder`,
      goal: {
        type: 'exact',
        text: `ash ember
smoke frost
salt and cinder`,
      },
      par: 16,
      solution: 'dwwdwjbdwwdwjwdw',
      teaches: ['d'],
      hints: [
        { en: 'Stand on the R of a ROT and type d w. The word and the space after it vanish together.', ko: 'ROT의 R 위에 서서 d w. 단어와 뒤따르는 공백이 함께 사라진다.' },
        { en: 'The cut leaves you on the next word. w carries you to the next ROT; j drops you one line.', ko: '벤 뒤에는 이미 다음 단어 위에 서 있다. w로 다음 ROT에 닿고, j로 한 줄 내려간다.' },
        { en: 'At the edge of a line, d e is the same blade — e stops at a word\'s last letter.', ko: '줄의 끝에서는 d e도 같은 칼이다. e는 단어의 마지막 글자에 선다.' },
      ],
    },
    {
      id: 'c03s2',
      name: { en: 'The Rot', ko: '부패' },
      brief: {
        en: 'The watch log is rotting from the inside. Three entries have gone to blight, and one more is turning.\n\nCut out the lines themselves — their letters were never the problem.',
        ko: '당직 기록이 안에서부터 썩고 있다. 세 줄이 이미 부패했고, 한 줄이 더 물들고 있다.\n\n문제는 글자가 아니니, 줄을 통째로 도려내라.',
      },
      whisper: { en: 'dd takes the whole line. A number in front takes that many.', ko: 'dd는 줄 하나를 통째로 가져간다. 앞에 숫자를 붙이면 그만큼.' },
      startChar: '0',
      text: `@3:00 tower awake
03:12 ROT in the well
03:15 ROT on the stair
03:19 ROT in the lamp
04:02 tower asleep
04:40 ROT on the sill
05:10 first bell`,
      goal: {
        type: 'exact',
        text: `03:00 tower awake
04:02 tower asleep
05:10 first bell`,
      },
      par: 7,
      solution: 'j3ddjdd',
      teaches: ['dd'],
      hints: [
        { en: 'dd deletes the line under you, and the next one slides up to take its place.', ko: 'dd는 커서가 있는 줄을 지우고, 다음 줄이 그 자리로 올라온다.' },
        { en: 'Three rotted entries stand together. 3dd takes all three in one breath.', ko: '부패한 세 줄이 나란히 서 있다. 3dd면 한 호흡에 셋이다.' },
        { en: 'One more blight waits below the survivors. j, then dd.', ko: '살아남은 줄 아래로 부패가 하나 더 있다. j, 그리고 dd.' },
      ],
    },
    {
      id: 'c03s3',
      name: { en: 'Rename', ko: '이름 바꾸기' },
      brief: {
        en: 'The nameplate burned in the night. The smith whispers the three words it must carry again: ASH, FIRE, KEPT.\n\nThree wrong things, three sizes — c does not only cut; it cuts, then puts the pen in your hand.',
        ko: '명판이 밤새 타 버렸다. 대장장이가 다시 새겨야 할 세 단어를 속삭인다: ASH, FIRE, KEPT.\n\n잘못된 곳은 셋, 크기도 제각각 — c는 베기만 하지 않고, 베고 나서 펜을 쥐여준다.',
      },
      whisper: { en: 'c w changes a word — on a word it moves like c e. s changes a character; S changes the line.', ko: 'c w는 단어를 바꾼다 — 단어 위에서는 c e처럼 움직인다. s는 한 글자를, S는 줄을 바꾼다.' },
      startChar: 'R',
      text: `+----------+
| @UST
| ?
| ####`,
      goal: {
        type: 'exact',
        text: `+----------+
| ASH
| FIRE
| KEPT`,
      },
      par: 22,
      solution: 'cwASH<Esc>jsFIRE<Esc>jS| KEPT<Esc>',
      teaches: ['c', 's', 'S'],
      hints: [
        { en: 'RUST must become ASH. Stand on the R: c w runs to the end of the word, so starting mid-word would leave its head behind.', ko: 'RUST가 ASH가 되어야 한다. R 위에 서라. c w는 단어 끝까지 달리므로, 중간에서 시작하면 앞머리가 남는다.' },
        { en: 'The lone ? is waiting for FIRE. s wipes that one character and opens insert where it stood.', ko: '홀로 남은 ?는 FIRE를 기다린다. s는 그 한 글자를 지우고, 있던 자리에 입력을 연다.' },
        { en: 'The burned line must read KEPT. S empties the line — border and all — then hands you the pen to write it whole.', ko: '타 버린 줄은 KEPT가 되어야 한다. S는 테두리까지 줄을 통째로 비우고, 다시 쓸 펜을 쥐여준다.' },
      ],
    },
    {
      id: 'c03s4',
      name: { en: 'The Copyist', ko: '필경사' },
      brief: {
        en: 'The litany is carved once, but the forge only hears it twice. Each verse waits for its own echo; the frame holds.\n\nyy copies the line you stand on, and p sets the copy down below you.',
        ko: '기도문은 한 번만 새겨졌지만, 대장간은 두 번 들어야 한다. 각 구절은 자기 메아리를 기다리고, 테두리는 그대로다.\n\nyy는 서 있는 줄을 담고, p는 그 사본을 아래에 내려놓는다.',
      },
      whisper: { en: 'yy then p. P lays the copy above you instead.', ko: 'yy 그리고 p. P는 사본을 위에 놓는다.' },
      startChar: 'h',
      text: `[ the forge ]
@ammer falls
bell answers
anvil rings
[ the forge ]`,
      goal: {
        type: 'exact',
        text: `[ the forge ]
hammer falls
hammer falls
bell answers
bell answers
anvil rings
anvil rings
[ the forge ]`,
      },
      par: 11,
      solution: 'yypjyypjyyp',
      teaches: ['yy', 'y', 'p', 'P'],
      hints: [
        { en: 'yy copies the line you are standing on. Nothing on the page moves yet.', ko: 'yy는 서 있는 줄을 복사한다. 아직 페이지에서는 아무것도 움직이지 않는다.' },
        { en: 'p sets the copy down under the line and leaves you on the copy. j carries you to the next verse.', ko: 'p는 사본을 줄 아래에 내려놓고 너를 그 위에 세운다. j가 다음 구절로 데려간다.' },
        { en: 'P is the same hand upside down: the copy lands above you instead.', ko: 'P는 같은 손을 뒤집은 것. 사본이 위에 놓인다.' },
      ],
    },
    {
      id: 'c03s5',
      name: { en: 'The Repeat', ko: '반복' },
      brief: {
        en: 'The rot has learned to repeat itself down the wall — the same wound, five times. Heal one line and let the dot speak for the rest.\n\nThe last line is nothing but rot; take the whole line out.',
        ko: '부패가 벽을 따라 자신을 반복하는 법을 배웠다 — 같은 상처가 다섯 번. 한 줄만 고치고, 나머지는 점에게 말하게 하라.\n\n마지막 줄은 부패뿐이니 줄째로 들어내라.',
      },
      whisper: { en: '. repeats your last change wherever you stand. Move, then dot.', ko: '.은 마지막 변경을 서 있는 곳에서 되풀이한다. 먼저 움직이고, 점.' },
      startChar: 'R',
      text: `@OT on the gate
ROT on the stair
ROT in the lamp
ROT in the well
ROT at the bell
ROT ROT ROT ROT`,
      goal: {
        type: 'exact',
        text: `on the gate
on the stair
in the lamp
in the well
at the bell`,
      },
      par: 13,
      solution: 'dwj.j.j.j.jdd',
      teaches: ['.'],
      hints: [
        { en: 'Cut the first ROT with d w. Then look: . repeats exactly that cut, wherever you stand.', ko: '첫 ROT을 d w로 벤다. 그리고 보라. .은 바로 그 베기를, 서 있는 곳에서 되풀이한다.' },
        { en: 'j keeps the same column, so each . lands on the next ROT. Four dots finish the wall.', ko: 'j는 같은 칸을 지켜 주므로 .은 다음 ROT 위에 내려앉는다. 점 네 번이면 벽이 끝난다.' },
        { en: 'The last line has no words left in it. d d takes the line itself.', ko: '마지막 줄에는 남은 말이 없다. d 두 번이 그 줄을 통째로 가져간다.' },
      ],
    },
  ],
};
