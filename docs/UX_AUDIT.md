# UX audit — 2026-11-12

Automated with `npm run browser:audit` (Playwright + Chromium 131, local-only),
then reviewed screenshots. Viewports: **1920×1080 (desktop, default)**,
390×844 (phone), 320×568 (small phone). Screens: title, map, chapter picker,
intro, play, hint, exit prompt, ghost HUD/result, results, trials, codex,
progress, settings.

## Result

```
audited 38 screen/viewports; 0 with overflow; 0 page errors
```

The phone/desktop screenshots are in `docs/browser/audit/` and
`docs/browser/desktop-*.jpg`; raw findings are in `docs/UX_AUDIT.json`.

## Fixed in this pass

- desktop play was a tiny canvas in the top-left of a 1920 window → the CRT is
  now a centered **1150×720 tube**; scanlines/vignette stay, the moving beam is
  disabled on desktop only for frame budget
- chapter/stage picker added: cleared stages replayable, future stages sealed
- 320px map footer chips and topbar meta overflowed → wrapping/ellipsis rules
- ghost HUD collided with the statusline → sits above it
- ghost result needed a visible hold → final cleared state is held 1.4s
- fractional ghost tween polluted relative gutter numbers → FX-only
  `cursorDraw`; gutter/highlight use the real Vim cursor

## Frame budget

`npm run browser:qa` on the **1920×1080 desktop tube**: ghost **56 rAF / 56
draw FPS** (headless CPU Chromium; real GPU should be higher). The gate fails
below 50. A 1200×760 tube was borderline (50.5), so 1150×720 was chosen for
margin; the backing canvas is also capped at 700k pixels.

## Remaining honest limits

- Headless CPU Chromium, not a phone GPU or a human visual pass.
- No screenshot-diff regression yet; screenshots are artifacts.
- The audit checks horizontal overflow, page errors and FPS, not subjective
  contrast/readability.
