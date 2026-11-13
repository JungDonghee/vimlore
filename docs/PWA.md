# Install KIRITSU as an app (PWA)

KIRITSU is a Chromium-installable PWA. The site must be served over HTTPS
(GitHub Pages is); `file://` cannot install or run a service worker.

## Install

- **Chrome / Edge desktop:** use the install icon in the address bar, or
  `⋮ → Install KIRITSU…`. When the browser offers it, the in-game
  `INSTALL KIRITSU` chip appears too.
- **Chrome on Android:** `⋮ → Install app` / `Add to Home screen`. The
  install chip appears when Chromium fires `beforeinstallprompt`.
- **iPhone:** Safari has no Chromium install prompt; use Share → Add to Home
  Screen. The page is still playable in the browser.

The installed app is `display: standalone`, has its own icon and window, and
runs from the same static files as the site.

## Landscape

The manifest requests `"orientation": "landscape"`, so an installed Android
app launches and stays landscape. A normal browser tab cannot lock a phone's
orientation without fullscreen (web platform restriction). In portrait:

1. a full-screen **LANDSCAPE REQUIRED** gate covers the game and blocks its
   keyboard input;
2. **ENTER FULLSCREEN LANDSCAPE** requests fullscreen then
   `screen.orientation.lock('landscape')`;
3. if the browser refuses, physically rotate the phone. The gate disappears as
   soon as the viewport is landscape.

iOS Safari ignores manifest orientation; the gate is the honest fallback. The
game layout is designed for a short, wide viewport.

## Offline

`public/sw.js` caches the shell, icons and the hashed JS/CSS discovered in
`index.html` during install. A navigation is network-first with a cached-shell
fallback, so a previously loaded game reopens offline. Bump `VERSION` in
`sw.js` when changing the PWA shell.

## Files

| file | purpose |
|---|---|
| `public/manifest.webmanifest` | name, icons, standalone, landscape, colors |
| `public/sw.js` | offline shell + runtime cache |
| `public/pwa.js` | install prompt, landscape gate, SW registration |
| `public/pwa.css` | install chip / rotate gate styling |
| `public/icons/icon.svg` | master mark: a large V made of terminal commands |
| `public/icons/*.png` | generated 192/512/maskable/apple/favicon icons |

The icon mark is intentionally a **V built from small shell/Vim commands**,
not a generic glyph. The PNGs are generated from the vector master by
`npm run pwa:icons` (dev-only; needs Playwright). The single-file
`dist/vimlore.html` strips the PWA tags and remains a self-contained game;
installation is for the hosted site.

## Verify

```bash
npm run build
npm run pwa:check   # deterministic CI gate: manifest, icons, SW, split
npm run pwa:qa      # Chromium: installability errors, SW, gate, offline
```

`pwa:check` runs in CI after the bundle budget. `pwa:qa` writes install/gate/
landscape evidence under `docs/browser/pwa/`.
