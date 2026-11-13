# GitHub presentation audit — 2026-11-13

## Current GitHub About

| field | current value |
|---|---|
| name | `vimlore` (repository URL; game is KIRITSU) |
| description | KIRITSU — 規律: a real-Vim cyberpunk bureaucratic noir. Kanji-first CRT title, 51 stages, diff-tested Vim engine, free offline PWA. In development. |
| homepage | <https://jungdonghee.github.io/vimlore/> |
| topics | `kiritsu`, `vim`, `neovim`, `vim-adventures`, `browser-game`, `pwa`, `offline`, `cyberpunk`, `crt`, `vector-graphics`, `ouyang-xun`, `terminal`, `typescript`, `game` |
| license | MIT |
| Pages | enabled, GitHub Actions deployment |

## Assets

| asset | current state |
|---|---|
| `public/icons/icon-512.png` | red hanko seal with 規律, chamfered hacker frame |
| `public/icons/favicon*.png/svg` | K seal, legible at 16 px |
| `docs/hero.jpg` | final kanji-first title screen, 1200×680 |
| `docs/social-preview.png` | final title crop, 1280×640 |
| `public/social-preview.png` | same card, served for OG/Twitter |
| `docs/story/title-screen-final.png` | live title capture |
| `docs/story/title-intro.webm` | recorded boot/typing/laser/flash intro |
| `docs/browser/pwa/*` | PWA landscape, portrait gate, offline screenshots |

Social preview and avatar are GitHub web-UI only; upload
`docs/social-preview.png` and `public/icons/icon-512.png` manually.

## Current live

<https://jungdonghee.github.io/vimlore/>

## Update checklist

1. `npm run pwa:qa` for the landscape screenshot.
2. Regenerate hero/social from a fresh 1920×1080 title capture.
3. Copy social to `public/`.
4. `npm run presentation:check && npm run doc-check && npm run budget`.
5. Push; verify CI + Pages and the live title.
