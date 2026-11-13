# KIRITSU — design notes

## The mark

**KIRITSU** is the game; **VIMLORE** is the world/series. The identity is a
**red hanko seal** carrying the sharp, hand-brushed **規律** in cream, framed by
a thin CRT bezel and phosphor grid. No generic robot, no neon gradient, no
stock "hacker" decoration.

- Kanji: **規律** (order, discipline / *kiritsu*), drawn from **Yuji Boku**
  brush-regular outlines. The same sound **起立** (*kiritsu*, standing up) is
  reserved for the hidden ending. The outline is vector, not a font dependency.
- Seal: oxidized vermilion, slightly displaced edge; the red is the Bureau's
  correction ink, not decoration.
- Frame: 2px green rule, four square corners, low-opacity vector grid.
- Cursor: a pale block at the seal's foot; the player is the cursor.
- Microtext: `KIRITSU // 2091`.

The favicon is a reduced **K** seal: it survives 16px downscaling, while the
full mark carries the kanji at 192/512 and on the title screen.

## Title screen

`KIRITSU` wordmark, red **規律**, then:

> KIRITSU — ORDER, DISCIPLINE  
> ORDER IS A FILE. YOU ARE THE CURSOR.  
> VIMLORE // A REAL-VIM CYBERPUNK MEMORY HEIST

The boot log carries the in-world numbers **2006.06.23** and
**CASE 0623 // 06:23**. They are not random decoration: they are the build,
the frozen city clock, and the final self-closure case. The title screen does
not explain them; the story does.

## Typography

- The wordmark uses the CRT serif/mono contrast already in the game.
- The kanji use a **hand-brushed regular script** — sharp, thinner than a black
  Mincho, visibly handwritten.
- Microcopy is monospace, tracked wide, uppercase. Korean copy is plain/banmal
  only; see [`KOREAN_STYLE.md`](KOREAN_STYLE.md).
- Red is reserved for the seal, deletion, and danger.

## Layout

- Desktop: wordmark, kanji, meaning, tagline, descriptor, press.
- Short landscape: bootlog left, wordmark centered, kanji below, description,
  press, footer; no vertical overlap.
- Portrait phone: the landscape gate takes precedence; the title is behind it.

## Regenerate

```bash
npm run pwa:icons      # vector seal -> PNGs (dev-only Playwright)
npm run pwa:check      # manifest/icons/SW/split (CI)
npm run pwa:qa         # installability, gate, offline, centering
npm run presentation:check
```

Attribution: [`KANJI_ATTRIBUTION.md`](KANJI_ATTRIBUTION.md). No third-party
fonts are fetched at runtime; the kanji are baked outlines.
