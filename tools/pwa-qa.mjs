/**
 * PWA installability/offline/landscape QA (local-only).
 *
 *   npm run build && npm run pwa:qa
 *
 * Verifies the manifest fields, a controlling service worker, offline reload,
 * the portrait gate and the landscape-first title layout. Screenshots land in
 * docs/browser/pwa/. Not a CI gate (needs a browser); `pwa:check` is the CI one.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve(root, '..', '.vimlore-browsers');
const { chromium } = await import('playwright');
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = join(dist, url === '/' ? 'index.html' : url);
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const shotDir = join(root, 'docs', 'browser', 'pwa');
mkdirSync(shotDir, { recursive: true });

const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); };
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return null;
  const res = await fetch(link.href);
  return { status: res.status, json: await res.json() };
});
check(manifest?.status === 200, 'manifest fetches with HTTP 200');
check(manifest?.json?.orientation === 'landscape', 'manifest locks orientation=landscape');
check(manifest?.json?.display === 'standalone', 'manifest display=standalone');
check((manifest?.json?.icons || []).some((i) => i.purpose === 'maskable'), 'manifest has a maskable icon');

const sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return { scope: reg.scope, active: reg.active?.state, controller: !!navigator.serviceWorker.controller };
});
check(sw?.active === 'activated', 'service worker is activated');
check(sw?.scope.endsWith('/'), 'service worker scope is the app root');

try {
  const cdp = await ctx.newCDPSession(page);
  const result = await cdp.send('Page.getInstallabilityErrors');
  const installErrors = result?.installabilityErrors || [];
  check(installErrors.length === 0, `Chromium installability errors: ${installErrors.length}`);
} catch (e) {
  console.log(`info installability probe unavailable: ${e.message.split('\n')[0]}`);
}

const portrait = await page.evaluate(() => ({
  display: getComputedStyle(document.querySelector('#pwa-rotate')).display,
  gated: document.body.classList.contains('pwa-gated'),
  coarse: matchMedia('(pointer: coarse)').matches,
}));
check(portrait.display === 'grid' && portrait.gated, 'portrait phone is blocked by the landscape gate');
check(portrait.coarse, 'Playwright emulates a coarse pointer');
await page.screenshot({ path: join(shotDir, 'portrait-gate.png') });

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(400);
const landscape = await page.evaluate(() => {
  const mark = document.querySelector('.title-mark')?.getBoundingClientRect();
  const press = document.querySelector('.press')?.getBoundingClientRect();
  const foot = document.querySelector('.title-foot')?.getBoundingClientRect();
  return {
    gate: getComputedStyle(document.querySelector('#pwa-rotate')).display,
    dx: mark ? Math.abs(mark.x + mark.width / 2 - innerWidth / 2) : 999,
    overlap: !!(press && foot && foot.height > 0 && press.bottom > foot.top),
    bootlog: getComputedStyle(document.querySelector('.bootlog')).display,
  };
});
check(landscape.gate === 'none', 'landscape hides the gate');
check(landscape.dx <= 3, `title wordmark is centered in landscape (dx ${landscape.dx.toFixed(1)}px)`);
check(!landscape.overlap, 'landscape title press/foot do not overlap');
check(landscape.bootlog === 'none', 'landscape hides the tall bootlog');
await page.screenshot({ path: join(shotDir, 'landscape-title.png') });

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
check(await page.evaluate(() => !!navigator.serviceWorker.controller), 'service worker controls the reloaded page');
await ctx.setOffline(true);
try {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(800);
  const title = await page.title();
  const text = await page.locator('#app').innerText();
  check(title === 'VIMLORE' && text.replace(/\s+/g, '').includes('VIMLORE'), 'offline reload is served from the cache');
  await page.screenshot({ path: join(shotDir, 'offline-title.png') });
} catch (e) {
  check(false, `offline reload failed: ${e.message.split('\n')[0]}`);
}
await ctx.setOffline(false);

check(errors.length === 0, `no console/page errors (${errors.length})`);
await browser.close();
server.close();
if (fails.length) {
  console.error(`\npwa:qa failed: ${fails.length}`);
  process.exit(1);
}
console.log('\npwa:qa passed — manifest, SW, landscape gate, offline cache');
