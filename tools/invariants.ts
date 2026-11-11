/**
 * Cross-layer invariants. This is the "cannot drift" gate:
 * the grimoire, chapter unlocks, stage metadata and stage solutions must agree.
 *
 * Hard errors exit 1. Coverage gaps are reported as warnings so the curriculum
 * audit can see them without lying about them.
 */
import { COMMANDS, COMMAND_BY_ID } from '../src/content/commands.ts';
import { CHAPTERS } from '../src/content/chapters/index.ts';
import { tokenize } from '../src/core/vim/keys.ts';
import { UNIVERSAL_KEYS } from '../src/core/game/session.ts';

const errors: string[] = [];
const warnings: string[] = [];

const chapterIds = new Set<string>();
const stageIds = new Set<string>();
const commandIds = new Set<string>();

for (const c of COMMANDS) {
  if (commandIds.has(c.id)) errors.push(`duplicate command id ${c.id}`);
  commandIds.add(c.id);
  if (!c.keys || !c.keys.trim()) errors.push(`command ${c.id}: empty keys`);
  if (!Number.isInteger(c.chapter) || c.chapter < 1 || c.chapter > 10) errors.push(`command ${c.id}: bad chapter ${c.chapter}`);
  if (!c.name?.en || !c.name?.ko) errors.push(`command ${c.id}: missing bilingual name`);
  if (!c.desc?.en || !c.desc?.ko) errors.push(`command ${c.id}: missing bilingual desc`);
  try {
    if (tokenize(c.keys).length === 0) errors.push(`command ${c.id}: untokenizable keys ${c.keys}`);
  } catch {
    errors.push(`command ${c.id}: key tokenizer threw on ${c.keys}`);
  }
}

if (COMMAND_BY_ID.size !== COMMANDS.length) errors.push(`COMMAND_BY_ID has ${COMMAND_BY_ID.size}, COMMANDS has ${COMMANDS.length}`);

const unlocked = new Set<string>();
let unlockWithoutGrimoire = 0;
for (let i = 0; i < CHAPTERS.length; i++) {
  const ch = CHAPTERS[i];
  if (ch.index !== i + 1) errors.push(`chapter ${ch.id}: index ${ch.index}, expected ${i + 1}`);
  if (chapterIds.has(ch.id)) errors.push(`duplicate chapter id ${ch.id}`);
  chapterIds.add(ch.id);
  for (const key of ch.unlocks) {
    // `unlocks` are raw key strings used by Session gating. Some (F/T, text
    // objects, <C-v>, :, marks) have no separate Grimoire row yet; that is a
    // coverage warning, not an inconsistency.
    if (typeof key !== 'string' || key.length === 0) errors.push(`chapter ${ch.id}: empty unlock`);
    else if (!COMMAND_BY_ID.has(key)) unlockWithoutGrimoire++;
    unlocked.add(key);
  }
}

const isUnlocked = (id: string): boolean => {
  const cmd = COMMAND_BY_ID.get(id);
  if (!cmd) return unlocked.has(id);
  if (cmd.id === 'count') return true; // numeric prefixes are universal
  if (unlocked.has(id) || unlocked.has(cmd.keys)) return true;
  if (UNIVERSAL_KEYS.has(cmd.keys) || UNIVERSAL_KEYS.has(cmd.id)) return true;
  // Doubled operators (dd/yy/cc) only need the base operator key.
  if (cmd.keys.length === 2 && cmd.keys[0] === cmd.keys[1] && unlocked.has(cmd.keys[0])) return true;
  // Ex commands are reachable once the `:` key itself is granted.
  return cmd.keys.startsWith(':') && unlocked.has(':');
};

const taught = new Set<string>();
for (const ch of CHAPTERS) {
  for (const st of ch.stages) {
    if (stageIds.has(st.id)) errors.push(`duplicate stage id ${st.id}`);
    stageIds.add(st.id);
    if (!Number.isInteger(st.par) || st.par <= 0) errors.push(`stage ${st.id}: bad par ${st.par}`);
    if (!st.solution || !st.solution.trim()) errors.push(`stage ${st.id}: empty solution`);
    if (!st.teaches?.length) errors.push(`stage ${st.id}: teaches is empty`);
    for (const id of st.teaches ?? []) {
      taught.add(id);
      const cmd = COMMAND_BY_ID.get(id);
      if (!cmd) {
        errors.push(`stage ${st.id}: teaches unknown command ${id}`);
        continue;
      }
      if (cmd.chapter > ch.index) errors.push(`stage ${st.id}: teaches ${id} from later chapter ${cmd.chapter}`);
      if (!isUnlocked(id)) warnings.push(`stage ${st.id}: teaches ${id} but no chapter unlocks it`);
    }
  }
}

for (const id of commandIds) {
  if (!taught.has(id)) warnings.push(`command ${id} is never declared by a stage`);
  if (!isUnlocked(id)) warnings.push(`command ${id} is never unlocked by a chapter`);
}

for (const w of warnings) console.warn('WARN ', w);
for (const e of errors) console.error('ERROR', e);
console.log(`invariants: ${CHAPTERS.length} chapters, ${stageIds.size} stages, ${COMMANDS.length} commands; ${errors.length} errors, ${warnings.length} warnings`);
console.log(`coverage gaps: ${unlockWithoutGrimoire} unlock key(s) without a Grimoire row; ${warnings.filter((w) => w.includes('never declared')).length} command(s) never declared by a stage`);
process.exit(errors.length ? 1 : 0);
