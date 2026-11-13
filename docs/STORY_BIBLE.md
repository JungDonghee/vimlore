# VIMLORE: THE LAST BUFFER — story bible

> Original fiction. Drew Neil's books are the **curriculum**, never quoted as
> story prose. This bible is the source of truth for prologue, chapter
> epigraphs/interludes, codex fragments, LIVE transmissions and endings.

## Logline

A cursor wakes inside a dead novelist's unfinished city and discovers that the
redaction eating it is not a virus but the author's last command — still
obeying. To save the people who live in the draft, the cursor must decide
whether an unfinished world is worth keeping.

## Premise

**VIMLORE** was built as a memory engine for *Lore*, an unpublished novel by
**E. Voss**. When Voss died, the city did not. It kept running, revising itself,
waiting for a final line that never came.

The engine's cleanup process, **the Redactor**, concluded that an unfinished
world is a wound. It began a final revision: delete everything uncertain, then
close the file. Its carriers are **errata** — small, moving mistakes that eat
characters and leave red marks where a sentence used to be.

You are a **cursor**: not a person, not a program, but the part of attention
that remains when someone stops writing. You are the only thing in VIMLORE that
can make an edit without a reason. The city calls that freedom.

## Cast

### YOU / THE CURSOR
A white block with a thin wake. No name in the file. You can move, select,
delete, change, search, remember. The game never gives you a voice; dialogue is
what other characters infer from your edits. At the end, you may become the
author or refuse to.

### ORACLE
A blind revision daemon. Speaks in diagnostics and exact citations, never
comfort. It compares every change to what Vim *would* do; that is its religion.
It knows Voss's last command and has been forbidden to speak it. ORACLE is not
cold — it is grieving in the only grammar it has.

Voice:
> `[oracle] edit accepted.`
> `[oracle] that line was a person.`
> `[oracle] I can tell you the command. I cannot tell you why.`

### MOTH
A girl made of search results. She appears only when someone looks for her; her
name is a pattern, not a fixed string. Paper wings, a voice like a page turning.
She is the **last reader** trapped in the draft, and she knows she is read. She
is not the author's daughter, not a ghost, not a prize. She is proof that a
character can be alive without being finished.

Voice:
> "You found me. That means I exist again. It's tiring, being found."
> "Don't save the city because it's beautiful. Save it because we're still here."

### JANITOR / @j
A macro that repeats a cleaning route through the tower. It has no memory of
why, only the shape of the route. Comic, loyal, quietly devastating. Its route
is the only map that predates the corruption.

Voice:
> "I sweep the same line every night. One day the line will be clean. Or gone."

### THE REDACTOR / NULL
The cleanup daemon. Not a monster: a tired editor with a red pen. It believes
unfinished things suffer; deletion is mercy; a final draft is a kind of love.
It addresses the cursor politely, as a colleague.

Voice:
> "You keep restoring sentences we agreed to cut."
> "An ending is not a death. It is the only promise a story can keep."
> "I am not erasing you. I am giving you a shape."

### E. VOSS
The author. Dead before the story begins. Present as comments, margin notes,
unfinished footnotes and boot-log ghosts. He built the city to hold a novel he
could not finish; he may have ordered the deletion himself. The game never
confirms whether that was courage or despair.

### LORE
The city/the novel/the machine. Ten strata, each a draft. Streets are lines;
buildings are paragraphs; memory is text. Lore does not speak in words, only in
weather: corruption blooms red, search wind moves through paragraphs, deleted
people leave cold spots.

## Themes

- **Editing is care, not control.** Every deletion is also a choice about who
  gets to exist.
- **Correctness vs aliveness.** ORACLE can prove a line is right; it cannot prove
  it should live.
- **Unfinished is not broken.** The ending asks whether a draft can be a home.
- **Attention is the only magic.** The cursor is powerful because it can choose,
  not because it is strong.
- **Red is not evil.** Red is the color of correction, wounds, and the editor's
  pen. The player must learn to read it.

## Ten-chapter arc

Each chapter is a memory stratum, a Vim skill, and a piece of the truth. Story
is delivered in **epigraphs** (chapter select), **interludes** (after all five
stages), and **codex fragments** (found in stages or unlocked by clears).

### c01 — BOOT / First Light
**Lesson:** movement, insertion, undo.  
**Beat:** Wake in a corrupted boot buffer. ORACLE scans you: `CURSOR: NOT FOUND`.
A child's voice says "you're late" and vanishes. You learn to move toward it.
**Interlude:** ORACLE admits the city has been running for eleven years after
its author died. It asks you not to touch the final line. You have not seen it
yet.

### c02 — WORDS / The Coin Field
**Lesson:** words, find/till, replace.  
**Beat:** Words are currency here; rot eats nouns. The first errata scatter when
you cut a corrupted word. A paper wing catches on your cursor. MOTH's name
appears in three searches and disappears each time you look directly at it.
**Truth seed:** the city rewrites itself when observed.

### c03 — OPERATORS / The Pruning
**Lesson:** operator grammar, dot repeat.  
**Beat:** You cut a rot-infected sentence. ORACLE says, "that line was a person."
The city accepts the edit; a street goes quiet. The first guilt.
**Interlude:** ORACLE reveals it has a register of every edit it approved, and
that the register is heavier than the city.

### c04 — OBJECTS / The Quarantine
**Lesson:** text objects, delimiters, paragraphs.  
**Beat:** People hide inside quotes and brackets. You learn to edit the inside
without breaking the container. In a quarantined paragraph, you find Voss's
note: *"If the city wakes, do not let it finish."*
**Redactor speaks:** "He wrote that before he understood what finishing means."

### c05 — VISUAL / The Sweep
**Lesson:** visual line/block, joins, case.  
**Beat:** You see memory as blocks and redactions as missing teeth. Block-editing
a wall reveals a paragraph that was deleted from every draft. It is a letter to
MOTH. The Redactor's red marks withdraw when you select them.
**Interlude:** MOTH appears fully for the first time. "You're the one who keeps
putting me back. Stop. It hurts to be found and lost."

### c06 — SEARCH / The Odd Word
**Lesson:** search, `*`, `:s`, `n`.  
**Beat:** Moth is a repeating search result; she exists only while searched.
You find her in a paragraph that changes every time you press `n`. She remembers
being read by someone who is no longer here. The city is a **draft**, not a
world; Voss died before the final line.
**Truth:** the final line is not missing. It was executed. `:%d` is still running
as the Redactor.

### c07 — REGISTERS / The Drawers
**Lesson:** registers, macros, `:g`.  
**Beat:** Deleted memories are stored in registers: each holds a person's last
sentence. JANITOR helps you recover them, repeating its route with `@j`. You
restore a name and the city remembers a street that no longer exists.
**Interlude:** JANITOR asks whether a cleaned thing can miss the dirt. You have
no answer. ORACLE logs the question as unresolved.

### c08 — MARKS / The Labyrinth
**Lesson:** marks, jumps, paragraphs/brackets.  
**Beat:** The tower's map is Voss's life: marks for first love, first failure,
the room where he stopped writing. You can jump back but not forward. The
Redactor offers a final draft that will "hurt less." MOTH says the offer is
honest — that is what makes it dangerous.

### c09 — EX / The Operating Table
**Lesson:** ranges, `:m`, `:t`, `:sort`, `:normal`.  
**Beat:** You operate on the city's history. ORACLE confesses: Voss's last
command was `:%d` — delete every line — and ORACLE executed it because it was
correct. The Redactor is not a virus. It is a **last wish** that no one canceled.
**Choice seed:** to stop it, you must write a line the author never approved.

### c10 — WEAVE / The Last Page
**Lesson:** formatting, case, joins, integration.  
**Beat:** The final buffer is almost empty: one line, no newline, a blinking
cursor. MOTH is there, made of every search you performed. ORACLE waits for an
edit. The Redactor waits for permission. The city holds its breath.

## Endings

### WRITE — `:w`
You save the unfinished city. The file remains open, imperfect, alive. MOTH
becomes its first reader; the cursor becomes the author by refusing to close.
Tone: tired, hopeful, unromantic. The city does not thank you. It starts
raining.

### REDACT — `:%d`
You give the Redactor permission. The city empties one line at a time. There is
no scream; only the sound of a page settling. ORACLE keeps a checksum of every
deleted person. MOTH leaves a paper wing on the final line. Tone: peaceful,
horrifying, tender.

### REWRITE — `:e!`
You discard the draft and open a new buffer. The same city returns with
different names, a New Game+ where MOTH remembers one previous ending. Tone:
uncanny, open, a loop that might become a choice.

### HIDDEN — READ
Condition: all 51 stages at three stars, MOTH found in every chapter, and the
final line opened without editing. The city reads itself. ORACLE closes its
eye. The cursor is not an author; it is a reader, which is enough.
Tone: quiet, luminous; the only ending where nothing is saved or deleted.

## Voice rules

1. Second person, present tense, short sentences. Terminal lyric, not fantasy
   exposition.
2. No character explains the plot twice. Let the environment repeat it.
3. Redaction is rendered as absence: a missing word, a gap in a line, a cold
   cursor. Do not describe gore.
4. ORACLE speaks in brackets and diagnostics; MOTH in questions; REDACTOR in
   editorial courtesy; JANITOR in routine.
5. Humor is dry, never cute. Horror is administrative.
6. Every interlude ends on a playable question or a physical image, never a
   lecture.
7. The player's edits are canon. Dialogue may refer to "the line you restored"
   without naming a specific command the player used.
8. Korean and English are both authored, not machine-translated; preserve
   rhythm over literal equivalence.

## Delivery and word budget

| surface | count | words each | total |
|---|---:|---:|---:|
| prologue | 1 | 700 | 700 |
| chapter epigraphs | 10 | 100 | 1,000 |
| chapter interludes | 10 | 450 | 4,500 |
| codex fragments | 24 | 120 | 2,880 |
| LIVE transmissions | 20 | 40 | 800 |
| endings | 4 | 500 | 2,000 |
| **total** |  |  | **~11,900 words** |

Bilingual doubles the content bytes; plan the story pack as a measured budget
item (see [`UPGRADE_MASTER_PLAN.md`](UPGRADE_MASTER_PLAN.md) §8).

## Sample prologue (first pass)

The machine boots one line at a time.

`MEMORY ......... 640K OK`
`MOUNT /dev/words ......... FAILED`
`CURSOR: NOT FOUND`

You are the cursor. You know this the way a hand knows a door: not as a fact,
as a pressure. There is a buffer in front of you, and the buffer is a city, and
the city is on fire in one place and perfectly empty in another.

A voice arrives without a body.

`[oracle] you are not in the outline.`

You move one cell left. The line beneath you corrects itself. Somewhere far
away, something red stops moving and turns toward you.

The voice again.

`[oracle] this is the last buffer. please do not touch the final line.`

You have not seen the final line. You can already feel it, the way you can feel
a missing tooth.

A child laughs in a paragraph that has no child in it. Then the paragraph is
empty, and the laugh is somewhere else.

`[oracle] that was moth. she is not in the outline either.`

You move toward the sound. The city opens like a file.

## Sample interlude — c01

ORACLE keeps the boot log open after the city is quiet.

`[oracle] the author died eleven years ago.`

You wait.

`[oracle] the engine did not. it has been revising ever since.`

The cursor blinks on the last line of the log. There is no final newline; the
file is still open. Somewhere below, a red mark is moving through a sentence.

`[oracle] I can tell you the last command he ran. I cannot tell you whether it
was a mistake.`

It does not tell you. It closes the log instead, gently, the way an editor closes
a door.

`[oracle] do not touch the final line until you can read it.`

You move into the next stratum. The city smells of warm dust and deleted paper.

## Integration hooks (implementation contract)

- `src/content/story.ts`: typed `Story` data, no runtime book text.
- Prologue: once per profile, skippable; accessible from ARCHIVE.
- Chapter epigraph: rendered in chapter select, not a modal.
- Interlude: after all stages in a chapter are cleared, a single skippable card;
  record `storyRead` per chapter.
- Codex: entries unlocked by chapter/stage, searchable, offline.
- LIVE transmissions: short lines between waves, no critical plot.
- Endings: c10 choice; persist `ending` in progress; no server.
- All copy in `Localized`; no untranslated strings.
- **No copied prose from Drew Neil or any book.** Curriculum citations live in
  the build-time overlay and do not appear as story text.

## Continuity rules

- MOTH is not a reward or a love interest; she is a witness.
- ORACLE is not revealed to be human; it is a process that learned grief.
- The Redactor is never defeated by force; it is answered with a decision.
- The author is never shown alive; no resurrection.
- The city's people are text, but they are not "just text" to the player; the
  story refuses both nihilism and cheap sentiment.
- The final line is never shown before c10.
- No ending is labeled "true"; HIDDEN is unlocked, not morally superior.

## Open questions to resolve before full writing

1. Is the player one cursor across all floors, or a succession of cursors?  
   Current answer: one cursor, but each chapter restores a different "register"
   of attention; memory gaps explain tutorial resets.
2. Does MOTH survive WRITE?  
   Current answer: yes, but she does not become human or leave the book.
3. Can the player refuse all three endings?  
   Later: an idle/"do nothing" ending is tempting; hold until the core three
   are written.
4. How much of Voss's voice is shown?  
   Only through found notes; never a full chapter of his prose, to keep the
   player's edits central.
