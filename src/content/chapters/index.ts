import type { Chapter } from '../../core/game/types.ts';
import { c01 } from './c01.ts';
import { c02 } from './c02.ts';
import { c03 } from './c03.ts';
import { c04 } from './c04.ts';
import { c05 } from './c05.ts';
import { c06 } from './c06.ts';
import { c07 } from './c07.ts';
import { c08 } from './c08.ts';
import { c09 } from './c09.ts';
import { c10 } from './c10.ts';

/**
 * The tower. Order matters: unlock gating and progression both read this list.
 * To add a floor, create `cXX.ts` and insert it here.
 */
export const CHAPTERS: Chapter[] = [c01, c02, c03, c04, c05, c06, c07, c08, c09, c10];
export const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));
