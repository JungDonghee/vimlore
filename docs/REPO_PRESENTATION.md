# GitHub presentation audit — 2026-11-13

This is the exhaustive checklist for the repository's public "About", images,
README and Pages metadata. Update it whenever the public face changes.

## Current GitHub About (set through the REST API)

| field | current value |
|---|---|
| name | `vimlore` |
| description | A CRT Vim adventure with a real, diff-tested Vim engine. 51 stages citing Drew Neil's Practical Vim, 88 commands, free/offline PWA. In development: coverage and gaps documented. |
| homepage | <https://jungdonghee.github.io/vimlore/> |
| topics | `vim`, `neovim`, `vim-adventures`, `vim-tutorial`, `vim-golf`, `game`, `browser-game`, `pwa`, `offline`, `education`, `typescript`, `terminal`, `crt`, `text-editor`, `learning-game`, `ascii-art` |
| license | MIT |
| visibility | public |
| Pages | enabled, GitHub Actions deployment |

## Images and social cards

| asset | role | current state |
|---|---|---|
| `public/icons/icon-512.png` | project mark, `any` icon | large **V formed from terminal commands**; vector master `public/icons/icon.svg` |
| `public/icons/icon-maskable-512.png` | maskable PWA icon | padded version of the same mark |
| `public/icons/favicon.svg`, `favicon-32.png`, `favicon-16.png` | browser tab icon | reduced V/command mark |
| `docs/hero.jpg` (1200×680) | README hero | current landscape dashboard, regenerated from `docs/browser/pwa/landscape-title.png` |
| `docs/social-preview.png` (1280×640) | GitHub social preview | current landscape title; upload manually (see below) |
| `public/social-preview.png` | Open Graph/Twitter card on Pages | referenced by absolute OG meta in `index.html` |
| `docs/browser/pwa/landscape-title.png` | README landscape screenshot | current title, bootlog/footer rails, exact center |
| `docs/browser/pwa/portrait-gate.png` | README portrait gate | current LANDSCAPE REQUIRED gate |
| `docs/browser/*.jpg`, `docs/browser/audit/*` | QA evidence | regenerated 2026-11-13; 50-screen audit green |

### What cannot be changed through the API

GitHub **social preview** and **repository avatar/icon** are web-UI-only. The
REST/GraphQL API does not expose them; see the community discussion
<https://github.com/orgs/community/discussions/197020>. The assets are ready:

- Social preview: upload `docs/social-preview.png` in
  **Settings → General → Social preview**.
- Avatar: upload `public/icons/icon-512.png` in **Settings → General → Avatar**.
- README hero and in-page OG image are already wired; no manual action for them.

## README and Pages

- README hero uses the current landscape dashboard, not the old play-field JPEG.
- The "Current state" block gives the honest percentages and debt links.
- OG/Twitter tags are in the `pwa:start…pwa:end` block; they are stripped from
  the self-contained `dist/vimlore.html` but served on the hosted site.
- `public/social-preview.png` is served at
  `https://jungdonghee.github.io/vimlore/social-preview.png` for the OG tags.
- All README relative links and images resolve (`doc-check` + link audit).

## CI / Pages / tags

- `ci` and `pages` workflows are green for the current HEAD.
- Tags exist for the 2026-11-12 sprint:
  `sprint-2026-11-12`, `sprint-2026-11-12-freeze`, `sprint-2026-11-12-final`.
  The public-presentation milestone is tagged `pwa-landscape-2026-11-13`.
- No formal semver release yet; don't invent one just to decorate the repo.

## Update checklist (when anything public changes)

1. Regenerate `docs/browser/pwa/landscape-title.png` via `npm run pwa:qa`.
2. Regenerate `docs/hero.jpg` and `docs/social-preview.png` from it (ffmpeg
   scale/pad; keep 1200×680 and 1280×640).
3. Copy social card to `public/social-preview.png`.
4. Run `npm run doc-check && npm run budget && npm run pwa:check`.
5. Update `README.md` metrics/status and this file's date.
6. Push; verify CI + Pages; fetch the live OG image and Page HTTP 200.
7. Manually re-upload social preview/avatar only if their visual changed.
