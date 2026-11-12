/**
 * Headless browser QA for VIMLORE (local-only; not a runtime dependency).
 *
 *   bash tools/browser-setup.sh   # once per machine, downloads Chromium
 *   npm run browser:qa
 *
 * Starts a static server for dist/, drives title -> map -> stage -> ghost,
 * writes screenshots to docs/browser/, and prints rAF/draw FPS. The game itself
 * remains a static single file; Playwright is a dev-only tool.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const browserRoot = resolve(root, '..', '.vimlore-browsers');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= browserRoot;

if (!existsSync(dist)) {
  console.error('dist/ missing: run npm run build first');
  process.exit(2);
}
const { chromium } = await import('playwright');

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
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

const shotDir = join(root, 'docs', 'browser');
mkdirSync(shotDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => {
  window.__raf = [];
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { window.__raf.push(t); cb(t); });
  window.__draws = 0;
  const di = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...args) { window.__draws++; return di.apply(this, args); };
});
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(350);
await page.screenshot({ path: join(shotDir, 'title.png') });
await page.keyboard.press('Enter'); await page.waitForTimeout(250);
await page.screenshot({ path: join(shotDir, 'map.png') });
await page.keyboard.press('Enter'); await page.waitForTimeout(350);
await page.screenshot({ path: join(shotDir, 'intro.png') });
await page.keyboard.press('Enter'); await page.waitForTimeout(350);
await page.screenshot({ path: join(shotDir, 'play.png') });
await page.evaluate(() => { window.__raf = []; window.__draws = 0; window.__t0 = performance.now(); });
await page.keyboard.press('F3');
await page.waitForTimeout(700);
await page.screenshot({ path: join(shotDir, 'ghost-hud.png') });
await page.waitForTimeout(1000);
await page.screenshot({ path: join(shotDir, 'ghost-result.png') });
const perf = await page.evaluate(() => {
  const ts = window.__raf;
  const span = ts.length > 1 ? ts[ts.length - 1] - ts[0] : 0;
  return {
    frames: ts.length,
    spanMs: Math.round(span),
    rafFps: span ? Math.round((ts.length / span) * 10000) / 10 : 0,
    drawFps: span ? Math.round((window.__draws / span) * 10000) / 10 : 0,
    elapsedMs: Math.round(performance.now() - window.__t0),
  };
});
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
await page.screenshot({ path: join(shotDir, 'after-ghost.png') });
await browser.close();
server.close();
console.log(`screenshots: ${shotDir}`);
console.log(`ghost perf: ${JSON.stringify(perf)}`);
if (errors.length) {
  console.error(`browser errors:\n${errors.join('\n')}`);
  process.exit(1);
}
if (perf.rafFps < 50 || perf.drawFps < 50) {
  console.error(`FAIL: rAF ${perf.rafFps}fps / draw ${perf.drawFps}fps < 50`);
  process.exit(1);
}
