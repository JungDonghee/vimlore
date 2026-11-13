# KIRITSU — story bible

> **KIRITSU** (規律, きりつ) means **order, discipline, rule**. The same sound,
> **起立** (きりつ), means **standing up**. The city is named for the first; the
> ending is named for the second.
>
> A cyberpunk bureaucratic noir. No romance. The emotional engine is
> institutional betrayal, identity, and the cost of order. The hard mechanics
> are in [`story/KIRITSU_LOGIC.md`](story/KIRITSU_LOGIC.md); the first scene is
> [`story/PROLOGUE.md`](story/PROLOGUE.md).

## Logline

A city runs on a legal document. Cursor 07 is the auditor whose own open
identity line is the last unresolved record in District 9. To close the
district he must execute a self-deletion order only his hand can sign. His
mentor released the order. His refusal only resets the loop and kills the
people he is trying to save.

## The city

**Neo-Tokyo, 2091.** After the Quiet Crash, the Lowline was rebuilt as
**KIRITSU**: a single editable ledger that schedules trains, debt, weather,
citizenship and memory. Every person is a line. Every line has a jurisdiction
and a closure hash. "Noise" is anything the ledger cannot resolve.

The **Bureau of Correction** employs human **Cursors**: auditors with Vim
muscle memory who edit the city in real time. They are not programmers. They
are clerks with root access.

**HELIX Systems** owns the protocol. The Bureau owns the people. Everyone
pretends those are different things.

The city clock is frozen at **06:23**. The first identity line was written at
**2006-06-23 06:23**. The final case is **CASE 0623**. Nobody in the Bureau
remembers why; the date is in the build, the clock, and the origin file.

## Cast

### CURSOR 07 / you
The youngest auditor. Perfect correction rate. No personnel file. Nine-minute
memory gap. Catches: `h j k l` before knowing his own name; the order on his
desk has his own number.

He is not a chosen one. He is the last **open line** in District 9, kept
unregistered so he can sign closures. He is the district's remaining error.

### KURO
Chief Auditor. 07's handler and mentor. Calm, precise, paternal in the way a
supervisor is paternal. He took 07 from the unregistered quarter as a child,
trained him, and wiped his memory after every loop. He signed the review on
CASE 0623. He cannot execute it for 07. He is the betrayer and the only person
who has been trying to end the loop.

### THE REGISTRAR
The KIRITSU protocol's voice. Not human. Not malicious. It speaks in closure
hashes, jurisdiction, and deadlines. It believes an unresolved line is
suffering and closure is mercy. It calls 07 "the auditor" and "the last open
field" in the same sentence.

### ORACLE
A blind audit daemon. It reports effects, not intentions. It knows the loop
count and the review signature; it cannot lie. Its brackets are the closest
thing the game has to a conscience.

### RIN
A child in the lower market. Unregistered. She trades battery scraps for
stories. 07 meets her while auditing noise. She is not a love interest, a
prophecy, or a reward. She is the reason "refusal" is not enough: if the loop
resets, she is erased with the district.

### AUDITOR ZERO
An older Cursor. Perfect closure record, no memory of a life outside the
Bureau. She believes order is the only kindness left. She is what 07 becomes if
he complies without asking who wrote the rule.

### JANITOR / @j
A cleaning macro. Repeats the same route through the Bureau at night. Its
trailing register contains the voice of the auditor who recorded it. Comic,
loyal, already dead.

## Name and numbers

- **規律 (きりつ)** — order, discipline. The official name.
- **起立 (きりつ)** — standing up. The hidden reading, used in the final chapter
  and one ending.
- Bureau backronym: **Kernel Integrity Regulation & Inspection Terminal —
  Standard Unit**.
- **2006-06-23 06:23** — the date/time of the first identity line, the sealed
  origin record, and the frozen city clock. Every loop begins at 06:23; the
  nine-minute audit window ends at 06:32.
- **CASE 0623** — the final self-closure case. The player encounters the number
  before understanding it: boot log, clock, case file, origin hash.

## Story arc

### c01 — 06:23 / The Nine-Minute Morning
07 wakes at 06:23 with a nine-minute gap. Kuro's voice says the night shift is
routine. A red case file waits: **CASE 0623 — SELF-CLOSURE**. ORACLE reports
`CURSOR 07: NOT FOUND`.
**Question:** why does the city know his number before he does?

### c02 — The Lower Market
07 audits a noise complaint in the lower market and meets RIN. On the wall is
a child's chalk mark, **起立**, half scratched out by a Bureau notice. 07 cannot
read it yet. She asks whether unregistered people still count. He deletes a corrupt vendor line to save her;
the city charges him for the edit.
**Question:** who pays for order?

### c03 — The Clean Room
07 closes a case and watches a memory-ghost disappear. ORACLE logs the ghost as
a person. Kuro says the ghost was a forged line. The first doubt.

### c04 — The Signature
07 finds a receipt for CASE 0623 dated **2006-06-23 06:23**, signed by Kuro.
The file predates 07's employment by nineteen years. Kuro changes the subject.

### c05 — The Unregistered
The lower market is scheduled for a closure sweep. 07 edits the sweep route to
give RIN time. The edit is flagged as noise. Kuro covers for him once.
**Question:** why does Kuro protect him if the order is already signed?

### c06 — 4,217
ORACLE's audit log shows the same district closure has run **4,217 times**. 07
has refused, been reset, and forgotten each time. The nine-minute gap is the
residue. The "night shift" is a loop.
**Reveal:** the city is not being maintained. It is being closed.

### c07 — The Open Line
07 finds his own origin record: an unregistered child, taken from the lower
market, never registered. His open line is the district's last unresolved
record. He is both the auditor and the error.

### c08 — Kuro's Review
Kuro admits he released CASE 0623, wiped 07 after each loop, and kept him
unregistered so he could sign. He cannot execute the closure himself; the
signature must be 07's. He says he is sorry. He does not stop.

### c09 — The Registrar
The Registrar explains the self-closure clause: it was written to prevent
tyranny, to ensure no one can erase a person without their own hand. The Bureau
has weaponized it. If 07 refuses, District 9 resets and RIN is erased. If he
signs, the district closes and the unregistered become registered numbers. If
he deletes the protocol, the city loses law. If he uses the undo buffer, he can
write a new identity and stand up.

### c10 — 起立
The final buffer is one order:
`CASE 0623 // CURSOR 07 // ACTION: SELF-CLOSURE // REVIEW: KURO`.
The clock is 06:23. The deadline is 06:32. The cursor is yours.

## Endings

### COMPLY — `dd`
Execute the self-closure. District 9 closes. RIN and the unregistered survive as
registered numbers, safe and unfree. 07 is deleted. Kuro signs the completed
audit and retires. The city remains orderly. The final image is the clock
moving to 06:24 for the first time in nineteen years.

### AUDIT — copy out
Refuse the signature; copy CASE 0623, the unregistered list and Kuro's review
into the public ledger. The loop resets, but the evidence leaves the quarantine.
RIN may be erased unless her line is copied into a register first. Truth at a
cost. The next auditor wakes with a file that already contains the answer.

### ERASE — delete KIRITSU
Delete the protocol root. Every line becomes unregistered; every closure is
void. The city loses scheduling, transit, life support. RIN is free and exposed.
Kuro dies with the Bureau. 07 may survive outside the buffer as an unregistered
cursor. Freedom is not safety.

### AWAKEN — 起立
Before confirming `dd`, open the undo buffer. It contains 07's original child
identity, saved by Kuro from the first loop. Insert it as a new line and
register it under 07's own motif. The open line closes as a **new person**, not
a deletion. District 9 closes without a sacrifice. The unregistered remain
unregistered; the district no longer needs a scapegoat. The chapter title
changes from 規律 to 起立. The clock moves.

## Why this is a Vim game and not a film

The story's laws are the game's grammar.

- The city is a buffer; `d` is deletion, `c` is correction, `y` is evidence,
  `"` is the evidence locker, `q/@` is a patrol replay, `m` is a checkpoint,
  `/` is internal affairs, `:g` is a purge, `:s` is a regulation rewrite,
  `:w` is a report, `:q!` is resignation.
- The final boss is **one order line**. The player edits it.
- CASE 0623's signature is the player's keystroke motif; the game has been
  recording it all along.
- Walls are jurisdiction; bugs are noise; one-shot evidence floors are records
  that can be read only once; registers are evidence.
- A film can show an auditor choosing. Only this game makes the audience type
  the closure.

## Delivery

| surface | content |
|---|---|
| title / boot | 06:23 clock, KIRITSU BIOS BUILD 2006.06.23, CURSOR 07 NOT FOUND |
| prologue | first nine-minute loop; CASE 0623 on the desk |
| chapter epigraphs | Bureau regulations with human cost |
| interludes | after each 5-stage chapter |
| codex | case files, Bureau memos, Kuro notes, RIN fragments, ORACLE logs |
| LIVE transmissions | noise alerts, Registrar closures, Kuro check-ins |
| endings | COMPLY / AUDIT / ERASE / AWAKEN |

All copy original. No Drew Neil prose. No real Tokyo company/trademark.

## Voice rules

1. Second person, present tense, short declarative sentences. Bureaucratic
   precision, quiet dread.
2. Korean is **plain/banmal** (`-다`, `-아라/어라`), never honorific. English is
   clipped noir.
3. ORACLE in brackets; REGISTRAR in regulation numbers; KURO in supervisor
   calm; RIN in questions; JANITOR in routine.
4. No romance. The bonds are mentor/ward, child, colleague, institutional.
5. Violence is administrative: stamps, closures, deleted lines. No gore.
6. The player's edits are canon. Dialogue may refer to "the line you closed"
   without naming a command.
7. The ending is not labeled "true." AWAKEN is hidden, not morally superior.
8. The date 2006-06-23 is never explained as a birthday. In-world it is the
   first identity line and the frozen clock; the player may attach meaning.

## Open questions

1. Does RIN survive AWAKEN? Current: yes, unregistered and free; she does not
   become a citizen.
2. Is Kuro redeemed? No. He is understood, not forgiven.
3. Does 07 have a real name? Only in the undo buffer; the player may restore it
   in AWAKEN.
4. Is the Registrar defeated? No. It is answered, not killed.
5. Can the player refuse all four? Refusal without action is the loop; there is
   no fifth structural edit in v1.
