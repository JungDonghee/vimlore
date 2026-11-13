# VIMLORE vs other Vim games (2026-11-13)

> External facts are from the linked official pages, fetched 2026-11-13. Do not
> treat competitor claims as benchmarks of our correctness. Scores are
> comparative judgments, not measurements.

## Direct comparison: Vim Adventures

Vim Adventures is the mature commercial reference: **13 hand-authored levels**,
more than **60 commands/motions**, a Textland adventure, hints, login/save,
stats, and challenges. The official page sells a **$35 game-only license (6
months)** or **$40 game + challenges (including a macro level and timed CTF
challenges)**. It has been public since **2012**. Its taught list includes
buffers and files (`:b`, `:ls`, `:w`, `:e`), which VIMLORE's single-buffer engine
does not yet expose.

| axis | VIMLORE (2026-11-13) | Vim Adventures |
|---|---|---|
| Core engine | Real single-buffer Vim reimplementation, differential-tested **373 of 373**; game-used **51 of 51**; 21,712-case matrix | Custom browser game based on Vim commands; not an auditable Vim reimplementation |
| Curriculum authority | Every stage cites **Practical Vim** (51 of 51); 48 of 123 tips represented; Modern Vim deferred | Structured 13-level arc; >60 commands |
| Level content | **51 short stages**, 10 chapters, par/3-star, TRIALS/GOLF; 75 Practical gaps | **13 larger hand-authored levels**, story, art, characters |
| Editor surface | One buffer; no files/windows/splits/quickfix/terminal | Teaches/uses buffers and files inside the game |
| Visual/audio | ASCII/CRT vector, WebAudio synth, PWA/landscape gate | Hand-drawn/pixel-art world, licensed art and sounds |
| Price/access | **Free, MIT, offline PWA**, no account/server | Paid license, account/login, browser |
| Mastery tooling | Par, best-keys, F3 ghost, GOLF result, TRIALS weakness/daily | Challenges, timed CTF (higher tier), stats/leaderboards |
| Maturity | New (2026), one developer-scale project | Public since 2012, commercial product |
| Mobile | Installable PWA, landscape enforced | Keyboard required; desktop browser |

**Verdict:** VIMLORE is **ahead on engine fidelity, transparency, book
citations, price and offline/PWA access**; **behind on authored campaign
content, art/audio production, editor-surface breadth, accounts/leaderboards and
brand maturity**. Against Vim Adventures as a finished commercial product,
VIMLORE is roughly **60% of that maturity level** — not a peer yet. Against it
as a *Vim learning engine*, VIMLORE already has the stronger auditable core.

## Other Vim-learning games

| tool | what it is | strengths | limits vs VIMLORE |
|---|---|---|---|
| **VimTutor** | built-in Vim tutorial, ~7 lessons | official, offline, zero install | not a game; little retention/feedback |
| **PacVim** | terminal Pac-Man: move the cursor, eat words, avoid ghosts | free/open-source, immediate hjkl/w/b drill | narrow command set, arcade only |
| **Vim Hero** | browser lessons, practice, stats; paid lifetime license | guided lessons + practice + stats | not an auditable real-Vim engine; no book-cited curriculum |
| **Vim Genius** | free browser drills | quick repetition, low friction | drills, not an adventure/curriculum |
| **VIMLORE** | CRT Vim adventure with real engine + Drew Neil spine | engine fidelity, citations, GOLF/TRIALS, free/offline PWA | campaign breadth, Modern Vim, full editor surface, art/audio |

## Where VIMLORE actually ranks today

- **Engine correctness / transparency:** top tier among open Vim-learning games.
  The differential oracle and game-used undo surface are rare.
- **Curriculum structure:** unusually rigorous for a game because every stage
  has a source citation; but only **48 of 123 Practical tips** are represented.
- **Finished content/adventure:** below Vim Adventures; above single-mechanic
  drills (PacVim/Vim Genius) in structure, below them in instant pick-up simplicity.
- **Production/brand:** below Vim Adventures; strong for a free/open project
  (installable PWA, offline, CI, docs), but no cloud saves/accounts/leaderboards.
- **Overall:** a promising **technical alpha/beta**, not a finished commercial
  competitor. The honest full-product estimate is [`COMPLETION.md`](COMPLETION.md)
  (~67% full vision, ~90% playable MVP).

## What would change the ranking

1. Convert the 39 supported Practical gaps into verified drills/GOLF and the 28
   deferred-surface gaps into real levels after the editor program.
2. Build the Modern Vim phase (buffers/windows/quickfix/terminal) with oracle
   tests.
3. A hand-authored campaign/visual/audio pass comparable to a commercial game.
4. Keep the free/offline/PWA and engine-transparency advantages.

## Sources

- Vim Adventures official site: <https://vim-adventures.com/> (levels, >60
  commands, $35/$40 licenses, 2012–2026, buffers/files, challenges).
- Vim Hero about: <https://www.vim-hero.com/about>; product:
  <https://www.vim-hero.com/> (lessons, practice, stats, lifetime license).
- Vim Genius overview: <https://www.classcentral.com/course/independent-vimgenius-203194>.
- PacVim package/description: <https://packages.debian.org/bookworm/pacvim>
  (Pac-Man-like Vim command practice; homepage
  <https://github.com/jmoon018/PacVim>).
- VimTutor is the tutorial shipped with Vim (`vimtutor`).

Fetched 2026-11-13; competitor prices/content can change.
