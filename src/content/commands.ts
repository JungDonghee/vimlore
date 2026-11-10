import type { Localized } from '../core/game/types.ts';

export interface CommandInfo {
  /** Stable id; also the key(s) taught. */
  id: string;
  keys: string;
  name: Localized;
  desc: Localized;
  chapter: number;
}

const c = (id: string, keys: string, en: string, ko: string, chapter: number, descEn = '', descKo = ''): CommandInfo => ({
  id,
  keys,
  name: { en, ko },
  desc: { en: descEn || en, ko: descKo || ko },
  chapter,
});

/**
 * The Grimoire. Every entry is a command the game teaches, tagged with the
 * chapter that introduces it. The codex UI and the "locked key" message both
 * read from here, so adding content stays a one-line change.
 */
export const COMMANDS: CommandInfo[] = [
  // Chapter 1 — foundations
  c('h', 'h', 'left', '왼쪽', 1, 'Move one character left.', '한 칸 왼쪽으로.'),
  c('j', 'j', 'down', '아래', 1, 'Move one line down.', '한 줄 아래로.'),
  c('k', 'k', 'up', '위', 1, 'Move one line up.', '한 줄 위로.'),
  c('l', 'l', 'right', '오른쪽', 1, 'Move one character right.', '한 칸 오른쪽으로.'),
  c('0', '0', 'line start', '줄 시작', 1, 'Jump to column 0.', '줄 맨 앞으로.'),
  c('$', '$', 'line end', '줄 끝', 1, 'Jump to the last character.', '줄 맨 끝으로.'),
  c('X', 'X', 'delete before', '앞 글자 삭제', 1, 'Delete the character before the cursor.', '커서 앞 글자를 지운다.'),
  c('s', 's', 'substitute char', '한 글자 변경', 3, 'Delete the character and insert.', '한 글자를 지우고 입력.'),
  c('S', 'S', 'substitute line', '줄 전체 변경', 3, 'Clear the line and insert.', '줄을 비우고 입력.'),
  c('x', 'x', 'delete char', '문자 삭제', 1, 'Delete the character under the cursor.', '커서 아래 문자를 지운다.'),
  c('i', 'i', 'insert', '삽입', 1, 'Insert before the cursor.', '커서 앞에 입력.'),
  c('I', 'I', 'insert at start', '줄 앞에 삽입', 1, 'Insert at the first non-blank character.', '줄의 첫 글자 앞에서 입력.'),
  c('a', 'a', 'append', '덧붙이기', 1, 'Insert after the cursor.', '커서 뒤에 입력.'),
  c('A', 'A', 'append at end', '줄 끝에 덧붙이기', 1, 'Insert at the end of the line.', '줄 끝에서 입력.'),
  c('o', 'o', 'open below', '아래에 열기', 1, 'Open a new line below.', '아래에 새 줄을 연다.'),
  c('O', 'O', 'open above', '위에 열기', 1, 'Open a new line above.', '위에 새 줄을 연다.'),
  c('u', 'u', 'undo', '되돌리기', 1, 'Undo the last change.', '마지막 변경을 되돌린다.'),
  c('esc', '<Esc>', 'escape', '탈출', 1, 'Return to normal mode. Never park in insert mode.', '노멀 모드로. 입력 모드에 주차하지 마라.'),

  // Chapter 2 — words & precision
  c('w', 'w', 'next word', '다음 단어', 2, 'Jump to the start of the next word.', '다음 단어 시작으로.'),
  c('b', 'b', 'back word', '이전 단어', 2, 'Jump to the start of the previous word.', '이전 단어 시작으로.'),
  c('e', 'e', 'word end', '단어 끝', 2, 'Jump to the end of the next word.', '다음 단어 끝으로.'),
  c('W', 'W', 'next WORD', '다음 WORD', 2, 'Like w, but punctuation does not split words.', '구두점을 무시한 단어 단위.'),
  c('B', 'B', 'back WORD', '이전 WORD', 2, 'Like b, for WORDs.', 'WORD 단위로 뒤로.'),
  c('E', 'E', 'WORD end', 'WORD 끝', 2, 'Like e, for WORDs.', 'WORD 단위 끝으로.'),
  c('r', 'r', 'replace char', '문자 교체', 2, 'Replace one character, stay in normal mode.', '한 글자만 바꾼다.'),
  c('~', '~', 'toggle case', '대소문자', 2, 'Flip the case of the character under the cursor.', '대소문자를 뒤집는다.'),
  c('f', 'f', 'find char', '문자 찾기', 2, 'Jump forward onto a character in this line.', '이 줄에서 문자로 점프.'),
  c('t', 't', 'till char', '문자 앞까지', 2, 'Jump to just before a character — safer than f.', '문자 바로 앞까지. f보다 안전하다.'),
  c(';', ';', 'repeat find', '찾기 반복', 2, 'Repeat the last f/t jump.', '마지막 f/t를 반복.'),
  c(',', ',', 'reverse find', '찾기 역방향', 2, 'Repeat the last f/t jump backwards.', '마지막 f/t를 반대로.'),

  // Chapter 3 — operators
  c('d', 'd', 'delete', '삭제', 3, 'Operator: delete over a motion or object.', '오퍼레이터: 모션/오브젝트만큼 삭제.'),
  c('c', 'c', 'change', '변경', 3, 'Operator: delete and enter insert mode.', '오퍼레이터: 지우고 입력 모드로.'),
  c('y', 'y', 'yank', '복사', 3, 'Operator: copy over a motion or object.', '오퍼레이터: 모션/오브젝트만큼 복사.'),
  c('p', 'p', 'put', '붙여넣기', 3, 'Paste after the cursor.', '커서 뒤에 붙여넣기.'),
  c('P', 'P', 'put before', '앞에 붙여넣기', 3, 'Paste before the cursor.', '커서 앞에 붙여넣기.'),
  c('.', '.', 'dot repeat', '점 반복', 3, 'Repeat the last change — Vim\'s superpower.', '마지막 변경을 반복. Vim의 초능력.'),
  c('dd', 'dd', 'delete line', '줄 삭제', 3, 'Delete the current line.', '현재 줄을 지운다.'),
  c('yy', 'yy', 'yank line', '줄 복사', 3, 'Copy the current line.', '현재 줄을 복사.'),
  c('cc', 'cc', 'change line', '줄 변경', 3, 'Clear the line and insert.', '줄을 비우고 입력.'),
  c('D', 'D', 'delete to end', '끝까지 삭제', 3, 'Delete from the cursor to the end of the line.', '커서부터 줄 끝까지 삭제.'),
  c('C', 'C', 'change to end', '끝까지 변경', 3, 'Delete to end of line, then insert.', '줄 끝까지 지우고 입력.'),

  // Chapter 4 — text objects
  c('iw', 'iw', 'inner word', '단어 안쪽', 4, 'The word under the cursor, without spaces.', '공백을 뺀 단어.'),
  c('aw', 'aw', 'a word', '단어 + 공백', 4, 'The word plus surrounding space.', '단어와 주변 공백.'),
  c('i"', 'i"', 'inside quotes', '따옴표 안', 4, 'Everything inside the nearest quotes.', '가장 가까운 따옴표 안쪽.'),
  c('a"', 'a"', 'around quotes', '따옴표 포함', 4, 'Inside plus the quotes themselves.', '따옴표까지 포함.'),
  c('i(', 'i(', 'inside parens', '괄호 안', 4, 'Everything inside the nearest brackets.', '가장 가까운 괄호 안쪽.'),
  c('a(', 'a(', 'around parens', '괄호 포함', 4, 'Inside plus the brackets.', '괄호까지 포함.'),
  c('it', 'it', 'inside tag', '태그 안', 4, 'Inside an HTML/XML tag pair.', '태그 사이 내용.'),
  c('ip', 'ip', 'inner paragraph', '문단', 4, 'The paragraph you are in.', '현재 문단.'),
  c('i{', 'i{', 'inside braces', '중괄호 안', 4, 'Inside the nearest { }.', '가장 가까운 { } 안쪽.'),
  c('a{', 'a{', 'around braces', '중괄호 포함', 4, 'Inside plus the braces.', '중괄호까지 포함.'),

  // Chapter 5 — visual mode
  c('v', 'v', 'visual', '비주얼', 5, 'Start a character-wise selection.', '문자 단위 선택 시작.'),
  c('V', 'V', 'visual line', '비주얼 줄', 5, 'Select whole lines.', '줄 단위 선택.'),
  c('C-v', '<C-v>', 'visual block', '비주얼 블록', 5, 'Select a rectangle.', '사각형 선택.'),
  c('>', '>', 'indent', '들여쓰기', 5, 'Shift right.', '오른쪽으로 들여쓰기.'),
  c('<', '<', 'outdent', '내어쓰기', 5, 'Shift left.', '왼쪽으로 내어쓰기.'),
  c('J', 'J', 'join lines', '줄 합치기', 5, 'Join this line with the next.', '다음 줄과 합친다.'),
  c('gJ', 'gJ', 'join raw', '공백 없이 합치기', 5, 'Join lines without adding a space.', '공백 없이 줄을 합친다.'),
  c('gv', 'gv', 'reselect', '재선택', 5, 'Reselect the last visual range.', '마지막 선택을 다시.'),

  // Chapter 6 — search & replace
  c('/', '/', 'search', '검색', 6, 'Search forward. `n` jumps to the next hit.', '앞으로 검색. n으로 다음.'),
  c('?', '?', 'search back', '역검색', 6, 'Search backwards.', '뒤로 검색.'),
  c('n', 'n', 'next match', '다음 일치', 6, 'Next search result.', '다음 검색 결과.'),
  c('N', 'N', 'prev match', '이전 일치', 6, 'Previous search result.', '이전 검색 결과.'),
  c('*', '*', 'search word', '커서 단어 검색', 6, 'Search for the word under the cursor.', '커서 아래 단어를 검색.'),
  c(':s', ':s///', 'substitute', '치환', 6, 'Replace on this line.', '이 줄에서 치환.'),
  c(':%s', ':%s///g', 'substitute all', '전체 치환', 6, 'Replace across the whole buffer.', '버퍼 전체 치환.'),

  // Chapter 7 — registers & macros
  c('"', '"a', 'register', '레지스터', 7, 'Choose which register to use.', '사용할 레지스터 선택.'),
  c('q', 'qa', 'record', '기록', 7, 'Record keystrokes into a register.', '키 입력을 녹화.'),
  c('@', '@a', 'play macro', '매크로 실행', 7, 'Replay a recorded register.', '녹화한 매크로 실행.'),
  c(':g', ':g//d', 'global', '전역 명령', 7, 'Run a command on matching lines.', '일치하는 줄에 명령 실행.'),

  // Chapter 8 — marks & jumps
  c('m', 'ma', 'mark', '마크', 8, 'Drop a bookmark.', '책갈피를 놓는다.'),
  c("'", "'a", 'goto mark', '마크로 이동', 8, 'Jump to a mark.', '마크로 점프.'),
  c('%', '%', 'match bracket', '괄호 짝', 8, 'Jump to the matching bracket.', '짝이 맞는 괄호로.'),
  c('{', '{', 'paragraph up', '문단 위', 8, 'Jump to the previous blank line.', '이전 빈 줄로.'),
  c('}', '}', 'paragraph down', '문단 아래', 8, 'Jump to the next blank line.', '다음 빈 줄로.'),
  c('C-o', '<C-o>', 'jump back', '점프 뒤로', 8, 'Go back in the jumplist.', '점프 목록에서 뒤로.'),

  // Chapter 9 — command line
  c(':m', ':m', 'move line', '줄 이동', 9, 'Move lines after another line.', '줄을 다른 위치로 옮긴다.'),
  c(':t', ':t', 'copy line', '줄 복사', 9, 'Copy lines after another line.', '줄을 다른 위치로 복사.'),
  c(':sort', ':sort', 'sort', '정렬', 9, 'Sort lines.', '줄을 정렬.'),
  c(':normal', ':normal', 'normal cmd', '노멀 명령', 9, 'Run normal-mode keys on a range.', '범위에 노멀 명령을 실행.'),

  // Chapter 10 — the weave
  c('gq', 'gq', 'format', '재포맷', 10, 'Reflow text to the text width.', '텍스트 폭에 맞춰 줄바꿈.'),
  c('gu', 'gu', 'lowercase', '소문자', 10, 'Operator: lowercase over a motion.', '오퍼레이터: 소문자로.'),
  c('gU', 'gU', 'uppercase', '대문자', 10, 'Operator: uppercase over a motion.', '오퍼레이터: 대문자로.'),
  c('g~', 'g~', 'toggle case', '대소문자 뒤집기', 10, 'Operator: flip case over a motion.', '오퍼레이터: 모션 범위의 대소문자를 뒤집는다.'),
];

export const COMMAND_BY_ID = new Map(COMMANDS.map((x) => [x.id, x]));

/** First keys a chapter unlocks (used by the gate). */
export const chapterUnlockKeys = (chapters: { unlocks: string[] }[], upTo: number): Set<string> => {
  const set = new Set<string>();
  for (let i = 0; i <= upTo && i < chapters.length; i++) for (const k of chapters[i].unlocks) set.add(k);
  return set;
};

export function chapterForKey(key: string): number | null {
  let best: number | null = null;
  for (const cmd of COMMANDS) {
    if (cmd.id === key || cmd.keys === key) {
      if (best === null || cmd.chapter < best) best = cmd.chapter;
    }
  }
  return best;
}
