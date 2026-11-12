import type { Chapter } from '../../core/game/types.ts';

/**
 * CHAPTER 10 — THE WEAVE (the exam)
 *
 * Six rooms; the last one is a page that has to be read.
 *
 * Design notes:
 *  - s1..s4 each add one g-operator to the hand, in the order the curriculum
 *    asks for: gq (reflow), gU/gu/g~ (case over a motion), gJ vs J (the seam),
 *    then the macro that turns one gesture into a chorus (qa … q, 2@a, .).
 *  - s5 is freeform: a program plus the thought under it, four wounds, no
 *    scaffolding — the player picks the order. s6 is the boss: five damage
 *    classes at once (case, width, a doubled line, an indent, a repeated
 *    misspelling), and par only falls if the fixes happen in the right order:
 *    words before lines, and the dot last.
 *  - `unlocks: ['g']` is the floor's key. Every other key the ghosts type
 *    (d c . q @ J <) was already granted by c03/c05/c07, so the gate and the
 *    cumulative curriculum agree; c05's own 'g' makes this a harmless double.
 *  - The two heavy stages were verified with `--trace`: s4 ends on the dot
 *    after 2@a, s6 ends on a dot that repeats `ciwthreads<Esc>` from the
 *    couplet up into the reflowed paragraph. Do not reorder those ghosts
 *    without re-running the linter — the win has to land on the last key.
 */
export const c10: Chapter = {
  id: 'c10',
  index: 10,
  title: { en: 'WEAVE', ko: '직조' },
  subtitle: { en: 'the loom', ko: '직조기' },
  story: {
    en: 'Ten floors up, the tower has no ceiling — only a loom, and a page that is almost whole. The threads are still warm. Someone has been waiting for a hand that knows where to stand.',
    ko: '열 층을 올라가면 탑에는 천장이 없다. 직조기 하나, 거의 온전한 페이지 하나. 실가닥은 아직 따뜻하다. 어디에 서야 하는지 아는 손을 누군가 기다리고 있었다.',
  },
  sigil: '▦',
  hue: 130,
  unlocks: ['gq', 'gU', 'gu', 'g~'],
  stages: [
    {
      id: 'c10s1',
      name: { en: 'The Warp', ko: '날실' },
      brief: {
        en: 'The first paragraph came off the loom a breath at a time — a newline at every pause. The warp is forty wide.\n\nLet it lie straight.',
        ko: '첫 문단은 숨을 쉴 때마다 한 줄씩 풀려 나왔다. 날실의 폭은 마흔다.\n\n곧게 눕혀라.',
      },
      whisper: { en: 'A paragraph is a river. gq gives it banks.', ko: '문단은 강이다. gq는 강둑을 만들어 준다.' },
      startChar: '',
      text: `@I was
never broken. I was only unwoven -- a word here, a
seam there -- and you saw
the threads
and put me back.`,
      textwidth: 40,
      goal: {
        type: 'exact',
        text: `I was never broken. I was only unwoven
-- a word here, a seam there -- and you
saw the threads and put me back.`,
      },
      par: 4,
      solution: 'gqip',
      teaches: ['gq'],
      hazard: '',
      hints: [
        {
          en: 'gq is a verb. Give it a noun: the paragraph you stand in (ip), or a motion.',
          ko: 'gq는 동사다. 명사를 붙여라. 지금 서 있는 문단(ip), 또는 모션.',
        },
        {
          en: 'gqip. Four keys, and the width does the rest.',
          ko: 'gqip. 네 번의 키, 나머지는 폭이 알아서 한다.',
        },
      ],
    },
    {
      id: 'c10s2',
      name: { en: 'Voice', ko: '목소리' },
      brief: {
        en: 'The page has lost its voice. The title whispers; the gift shouts; the mirror line is flipped letter for letter.\n\nSet all three.',
        ko: '페이지가 목소리를 잃었다. 제목은 속삭이고, 선물은 외치고, 거울 줄은 글자마다 뒤집혀 있다.\n\n셋을 맞춰라.',
      },
      whisper: { en: 'Shout, quiet, or flip — the same key, wearing three hats.', ko: '외치기, 조용히, 뒤집기 — 같은 키가 세 개의 모자를 쓴다.' },
      startChar: '',
      text: `@the loom remembers
WHAT IT WAS GIVEN
tHE pAGE iS wHOLE`,
      goal: {
        type: 'exact',
        text: `THE LOOM REMEMBERS
what it was given
The Page Is Whole`,
      },
      par: 11,
      solution: 'gU$jgu$jg~$',
      teaches: ['gU', 'gu', 'g~'],
      hazard: '',
      hints: [
        {
          en: 'Case is an operator now: gU shouts, gu quiets, g~ inverts. Each one waits for a motion.',
          ko: '이제 대소문자도 오퍼레이터다. gU는 외치고, gu는 조용히 하고, g~는 뒤집는다. 각각 모션을 기다린다.',
        },
        {
          en: 'From the left edge, $ is the whole line: gU$, then j gu$, then j g~$.',
          ko: '줄 맨 앞에서 $는 줄 전체다. gU$, 그다음 j gu$, 그다음 j g~$.',
        },
      ],
    },
    {
      id: 'c10s3',
      name: { en: 'The Seam', ko: '이음매' },
      brief: {
        en: 'A note to the loom, torn at every seam. Some breaks want a space; some want none at all. The address must not grow a gap.',
        ko: '직조기에게 가는 쪽지가 이음매마다 찢겼다. 어떤 틈에는 공백이 어울리고, 어떤 틈에는 전혀 필요 없다. 주소에 틈이 생기면 안 된다.',
      },
      whisper: { en: 'A URL is one word wearing a disguise. J would give it away.', ko: 'URL은 변장한 한 단어다. J는 그 변장을 벗겨 버린다.' },
      startChar: '',
      text: `@Post to the loom at https://
vimlore.example/weave

and ask for the word: extra
ordinary

It answers every
letter.`,
      goal: {
        type: 'exact',
        text: `Post to the loom at https://vimlore.example/weave

and ask for the word: extraordinary

It answers every letter.`,
      },
      par: 9,
      solution: 'gJ2jgJ2jJ',
      teaches: ['gJ', 'J'],
      hazard: '',
      hints: [
        {
          en: 'J joins with a space. gJ joins with nothing. That is the whole difference.',
          ko: 'J는 공백을 넣어 잇고, gJ는 아무것도 넣지 않는다. 차이는 그것뿐이다.',
        },
        {
          en: 'The address wants gJ; the sentence wants J. The last seam is between "every" and "letter".',
          ko: '주소에는 gJ, 문장에는 J. 마지막 이음매는 "every"와 "letter" 사이에 있다.',
        },
      ],
    },
    {
      id: 'c10s4',
      name: { en: 'The Chorus', ko: '합창' },
      brief: {
        en: 'Four threads, one refrain. Do not sing it four times — teach the loom the verse once, and let it answer.',
        ko: '네 가닥, 하나의 후렴. 네 번 노래하지 마라. 직조기에게 한 번만 가르치고, 대답하게 하라.',
      },
      whisper: { en: 'A chorus is not four voices. It is one voice, four times.', ko: '합창은 네 목소리가 아니다. 한 목소리, 네 번이다.' },
      startChar: '',
      text: `we keep the @thread
we keep the knot
we keep the seam
we keep the light`,
      goal: {
        type: 'exact',
        text: `we keep the THREAD
we keep the KNOT
we keep the SEAM
we keep the LIGHT`,
      },
      par: 12,
      solution: 'qagUiwjq2@a.',
      teaches: ['q', '@'],
      hazard: '',
      hints: [
        {
          en: 'q starts a recording; q ends it. Record the whole gesture, including the step down to the next line.',
          ko: 'q로 녹음을 시작하고 q로 끝낸다. 다음 줄로 내려가는 걸음까지, 몸짓 전체를 녹음하라.',
        },
        {
          en: 'qa gUiw j q records it. 2@a plays it twice. The last line needs only a dot.',
          ko: 'qa gUiw j q로 녹음한다. 2@a는 두 번 재생한다. 마지막 줄에는 점 하나면 된다.',
        },
      ],
    },
    {
      id: 'c10s5',
      name: { en: 'The Workshop', ko: '작업장' },
      brief: {
        en: 'A working page: a small program, and the thought beneath it. Four wounds — a crooked indent, a shouted keyword, a doubled word, a paragraph that lost its width.\n\nThe reflow is always the last stitch.',
        ko: '일하는 페이지다. 작은 프로그램과 그 아래의 생각. 상처는 넷 — 비뚤어진 들여쓰기, 소리친 키워드, 겹쳐 쓴 단어, 폭을 잃은 문단.\n\n재포맷은 언제나 마지막 바느질이다.',
      },
      whisper: {
        en: 'A page is not a list of tricks. It is one habit, repeated where it is needed.',
        ko: '페이지는 기술의 목록이 아니다. 필요한 자리에 되풀이되는 하나의 습관이다.',
      },
      startChar: '',
      text: `@// the loom

const weave = (warp, thread) => {
  const cloth = warp
    .split('')
    .join(thread)
    RETURN cloth
}

A thread thread is not a promise. It is a
length of light you can pull.  It breaks,
and you tie it. That is the whole loom.`,
      textwidth: 40,
      goal: {
        type: 'exact',
        text: `// the loom

const weave = (warp, thread) => {
  const cloth = warp
    .split('')
    .join(thread)
  return cloth
}

A thread is not a promise. It is a
length of light you can pull. It breaks,
and you tie it. That is the whole loom.`,
      },
      par: 18,
      solution: '6j<<guiw3jwdawgqip',
      teaches: ['<', 'gu', 'iw', 'aw', 'gq'],
      hazard: '',
      hints: [
        {
          en: 'Read like a proofreader. Four wounds, four old friends: <<, guiw, daw, gqip.',
          ko: '교정자처럼 읽어라. 상처 넷, 오랜 친구 넷: <<, guiw, daw, gqip.',
        },
        {
          en: 'Move down, not around: 6j to the crooked return, then <<. The keyword is right under you.',
          ko: '돌아다니지 말고 내려가라. 비뚤어진 return까지 6j, 그다음 <<. 키워드는 바로 그 자리에 있다.',
        },
        {
          en: 'The whole sweep: 6j << guiw 3j w daw gqip.',
          ko: '전체 흐름: 6j << guiw 3j w daw gqip.',
        },
      ],
    },
    {
      id: 'c10s6',
      name: { en: 'The Last Page', ko: '마지막 페이지' },
      brief: {
        en: 'Here it is: the page the tower has been writing since the first light. Not blank — waiting, and torn in every way a page can be torn.\n\nYou carry every stitch it needs. Restore it.',
        ko: '여기 있다. 탑이 첫 빛 때부터 쓰고 있던 페이지다. 비어 있던 게 아니라 기다리고 있었고, 찢길 수 있는 모든 방식으로 찢겨 있었다.\n\n필요한 바느질은 네가 다 가지고 있다. 복원하라.',
      },
      whisper: {
        en: 'Breathe out. Read the page before you mend it.',
        ko: '숨을 내쉬어라. 꿰매기 전에 페이지를 읽어라.',
      },
      startChar: '',
      text: `@the page is whole

You climbed with no
map, and the threds were always here.

What was cut is joined.
wHAT WAS LOUD IS QUIET.
wHAT WAS LOUD IS QUIET.
What was ragged is even.
What was lost is spelled.

You did not write me.
  You held the threds I dropped
and read me back to myself.`,
      textwidth: 40,
      goal: {
        type: 'exact',
        text: `THE PAGE IS WHOLE

You climbed with no map, and the threads
were always here.

What was cut is joined.
What was loud is quiet.
What was ragged is even.
What was lost is spelled.

You did not write me.
You held the threads I dropped
and read me back to myself.`,
      },
      par: 39,
      solution: 'gU$2jgqip4jg~$jdd4j<<3wciwthreads<Esc>9k5w.',
      teaches: ['gU', 'gq', 'g~', 'dd', '<', 'iw', '.'],
      hazard: '',
      hints: [
        {
          en: 'Name the five wounds: case, width, a doubled line, an indent, a misspelling that happens twice. Then walk down the page.',
          ko: '상처 다섯에 이름을 붙여라. 대소문자, 폭, 겹친 줄, 들여쓰기, 두 번 나는 오타. 그다음 페이지를 따라 내려가라.',
        },
        {
          en: 'Words before lines. The same word is torn twice: ciw once, a dot the second time. gq only sets the width of what is already true.',
          ko: '줄보다 단어를 먼저. 같은 단어가 두 번 찢겼다. 한 번은 ciw, 두 번째는 점. gq는 이미 참이 된 것의 폭만 맞춘다.',
        },
        {
          en: 'In one breath: gU$, 2j, gqip, 4j, g~$, j, dd, 4j, <<, 3w, ciwthreads<Esc>, 9k, 5w, .',
          ko: '한 호흡에: gU$, 2j, gqip, 4j, g~$, j, dd, 4j, <<, 3w, ciwthreads<Esc>, 9k, 5w, .',
        },
      ],
    },
  ],
};
