# KIRITSU — design notes (final title)

## Rule

**Kanji is the name.** `規律` is the only masthead. `kiritsu` is a code
identifier in the boot strip, not a corner label. Russian lettering was removed:
it did not belong to the CRT vector language.

## Title

- **Ouyang Xun brush**: real Ouyang-style scans of 規/律, cleaned, vectorised,
  then normalised into equal cells so the pair reads as one word. No red seal
  box, no hanko frame, no duplicate colour per glyph.
- **Laser write**: bootlog types; a red beam crosses; the brush ink is revealed
  behind it with stepped clipping; one flash; caption and press rise.
- **CRT vector display**: 80 px phosphor grid, scanlines, a slow beam sweep,
  monospace telemetry, phosphor green text, case/redaction accents.
- **Sakura**: petals only. The organic branch was removed because its curves
  fought the vector display.
- **Code-native name**: `CALL kiritsu` in the bottom assembly strip. The code
  is part of the design, not decoration in a corner.
- **Numbers**: `2006.06.23`, `CASE 0623`, `06:23`, `MOV EAX, 0x0623`.
- **Layout**: original VIMLORE vertical axis — bootlog, kanji, caption,
  tagline, press; metadata rails at top and bottom.

## Colours

| token | use |
|---|---|
| `#050b08` | CRT black |
| `#a9ffc5` / `#c9ffda` | phosphor / telemetry |
| `#f2d8c9` | Ouyang ink |
| `#ff5a72` | laser, case, open line |
| sakura `#ff9fba` → `#ffe0e8` | falling petals |

## Responsive

- Desktop: centered 430 px kanji stage, bootlog, code strip.
- Short landscape: 300 px stage, one-line code strip, compressed bootlog.
- Portrait: landscape gate.
- Reduced motion: no beam, full ink, no petal animation.

## Asset pipeline

- Ouyang scans → component clean → Potrace → balanced cell SVG.
- Title SVG is inlined into `dist/vimlore.html`; the hosted build loads it as a
  normal public asset.
- PWA icons remain the red seal `規律`; favicon is the K seal.

Attribution: [`KANJI_ATTRIBUTION.md`](KANJI_ATTRIBUTION.md).
