# Browser QA (headless Chromium)

VIMLORE is checked in a real browser locally. **Playwright is a dev-only tool**;
the shipped bundle still has zero runtime dependencies.

## One-time setup

```bash
npm install                 # installs the playwright dev dependency
npm run browser:setup       # downloads Chromium to ../.vimlore-browsers
```

The persistent browser cache is outside the repo at
`/home/jung/ai_station/sandbox/.vimlore-browsers` (~862 MB). It survives a
reboot; `browser:setup` is only needed on a fresh machine. If the cache is
missing, `browser:qa` prints the launch error and the setup command.

## Run

```bash
npm run build
npm run browser:qa
```

It starts an ephemeral static server for `dist/`, drives
title → map → intro → play → ghost, writes screenshots to `docs/browser/`,
and measures the ghost:

```
ghost perf: {"frames":118,"spanMs":1950,"rafFps":60.5,"drawFps":60.5}
```

`browser:qa` fails if requestAnimationFrame or canvas draw FPS is below 50, or
if the page logs an error. It is intentionally **not** in CI: GitHub's headless
runner has no GPU and the browser binary is large. Run it on the Fedora machine
before shipping UI changes.

## What it already caught

- ghost HUD overlapped the statusline on 390×844
- the ghost result was not held long enough to be visible
- fractional cursor tween values corrupted the relative line-number gutter
  (fixed with an FX-only `cursorDraw`; gutter/highlight use the real cursor)
- ghost redraw previously waited for the 530 ms cursor blink

## Limitations

- Headless Chromium on CPU; not a phone GPU, not a full visual review.
- The emulated viewport is 390×844, DPR 1.
- No automated screenshot diff yet; screenshots are artifacts for a human or
  vision-capable reviewer.
