/**
 * Content model.  A Chapter is a floor of the tower; a Stage is one chamber.
 * Everything is data: adding content never requires touching the engine or UI.
 */

export interface Localized {
  en: string;
  ko: string;
}

export type Goal =
  /** Cursor must land on (any occurrence of) `char`. */
  | { type: 'reach'; char: string }
  /** Buffer must equal `text` (trailing whitespace and trailing blank lines ignored). */
  | { type: 'exact'; text: string }
  /** Specific 1-based lines must match exactly (trimmed). */
  | { type: 'lines'; from: number; lines: string[] }
  /** Buffer must contain no instance of `chars`. */
  | { type: 'none'; chars: string }
  /** Cursor must be at a 0-based position. */
  | { type: 'cursor'; line: number; col: number }
  /** Collect every `char` by landing on it. */
  | { type: 'collect'; char: string }
  | { type: 'all'; of: Goal[] };

export interface Stage {
  id: string;
  name: Localized;
  /** Story + objective, shown on the intro card. Keep it short and warm. */
  brief: Localized;
  /** Initial buffer. `@` marks the start position (replaced by `startChar`). */
  text: string;
  /** Character left where `@` was. Defaults to a space. */
  startChar?: string;
  goal: Goal;
  /** Keystroke par. Verified by tools/level-lint.ts against `solution`. */
  par: number;
  /** The intended key sequence; also powers the "ghost" replay hint. */
  solution?: string;
  /** Command ids taught here (see src/content/commands.ts). */
  teaches?: string[];
  /** Progressive hints, cheapest first. */
  hints?: Localized[];
  /** Characters that hurt when the cursor lands on them. Defaults to "~". */
  hazard?: string;
  hearts?: number;
  /** Override the render width for gq/gw. */
  textwidth?: number;
  /** Optional flavour: a line spoken by a character on arrival. */
  whisper?: Localized;
}

export interface Chapter {
  id: string;
  index: number;
  title: Localized;
  subtitle: Localized;
  /** Short story beat shown on the map. */
  story: Localized;
  /** 1-3 char sigil drawn on the map. */
  sigil: string;
  hue: number;
  /** First keys/commands unlocked by finishing this chapter. */
  unlocks: string[];
  stages: Stage[];
}

export type Stars = 0 | 1 | 2 | 3;

export interface StageRecord {
  cleared: boolean;
  bestKeys: number;
  stars: Stars;
}

export interface StatEntry {
  attempts: number;
  clears: number;
  restarts: number;
  keys: number;
  par: number;
}

export interface SavedTrial {
  seed: number;
  skill: string;
  at: number;
}

export interface Progress {
  version: number;
  currentChapter: number;
  stages: Record<string, StageRecord>;
  seen: string[];
  totalKeys: number;
  startedAt: number;
  lang: 'ko' | 'en';
  sound: boolean;
  ghost: boolean;
  /** CRT scanlines / bloom / flicker. Off for weak devices. */
  crt: boolean;
  /** gutter: off | abs | rel | both */
  lineNumbers: 'off' | 'abs' | 'rel' | 'both';
  /** Local, login-free identity. `code` is a portable export of everything. */
  profile: { name: string; since: number };
  /** Per-skill telemetry powering the weakness trainer. */
  stats: Record<string, StatEntry>;
  /** Generated chambers the player chose to keep. */
  saved: SavedTrial[];
  trialsCleared: number;
  /** YYYY-MM-DD -> actions, for the contribution grass. */
  activity: Record<string, number>;
}

export const emptyProgress = (): Progress => ({
  version: 1,
  currentChapter: 0,
  stages: {},
  seen: [],
  totalKeys: 0,
  startedAt: Date.now(),
  lang: 'en',
  sound: true,
  ghost: true,
  crt: true,
  lineNumbers: 'abs',
  profile: { name: 'operator', since: Date.now() },
  stats: {},
  saved: [],
  trialsCleared: 0,
  activity: {},
});
