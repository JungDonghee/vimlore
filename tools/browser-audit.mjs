/**
 * Multi-viewport visual/interaction audit (local-only).
 *
 *   npm run build && node tools/browser-audit.mjs
 *
 * Checks title/map/chapter/intro/play/hint/exit/ghost/result/trials/codex/
 * progress/settings for horizontal overflow, off-viewport elements, page
 * errors, and ghost FPS. Phone screenshots go to docs/browser/audit/.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve(root, '..', '.vimlore-browsers');
const { chromium } = await import('playwright');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = join(dist, url === '/' ? 'index.html' : url);
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const shotDir = join(root, 'docs', 'browser', 'audit');
mkdirSync(shotDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const report = [];
const errors = [];

const overflow = async (page) => page.evaluate(() => {
  const vw = window.innerWidth;
  const out = [];
  if (document.documentElement.scrollWidth > vw + 1) out.push(`document scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.left < -1 || r.right > vw + 1) {
      out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0,2).join('.')} [${Math.round(r.left)},${Math.round(r.right)}]`);
      if (out.length >= 8) break;
    }
  }
  return out;
});

async function route(page, steps) {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(120);
  for (const s of steps) { await page.keyboard.press(s); await page.waitForTimeout(180); }
}
async function audit(page, vp, name, shot = false) {
  const bad = await overflow(page);
  if (shot) await page.screenshot({ path: join(shotDir, `${vp}-${name}.png`) });
  report.push({ viewport: vp, screen: name, overflow: bad });
}

for (const vp of ['1920x1080', '390x844', '320x568']) {
  const [w, h] = vp.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${vp} ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${vp} ${m.text()}`); });
  const phone = vp === '390x844';

  await route(page, []);
  await audit(page, vp, 'title', phone);
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  await audit(page, vp, 'map', phone);
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  await audit(page, vp, 'chapter', phone);
  if (vp === '390x844') {
    const locked = await page.locator('.chapter-stage.locked').count();
    if (locked < 1) errors.push('chapter: expected locked future stages');
    await page.keyboard.press('j'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    if (await page.locator('.screen.play').count()) errors.push('chapter: a locked stage entered play');
    await page.keyboard.press('g'); await page.waitForTimeout(80);
  }
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  await audit(page, vp, 'intro', phone);
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  await audit(page, vp, 'play', phone);
  await page.keyboard.press('Tab'); await page.waitForTimeout(150);
  await audit(page, vp, 'hint', phone);
  await page.keyboard.press('F10'); await page.waitForTimeout(150);
  await audit(page, vp, 'exit', phone);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  if (phone) {
    await page.keyboard.press('F3'); await page.waitForTimeout(700);
    await audit(page, vp, 'ghost-hud', true);
    await page.waitForTimeout(1000);
    await audit(page, vp, 'ghost-result', true);
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  }

  // Results: first stage solution is llllllljj.
  await route(page, ['Enter', 'Enter', 'Enter', 'Enter']);
  await page.keyboard.type('llllllljj'); await page.waitForTimeout(350);
  await audit(page, vp, 'results', phone);
  if (vp === '390x844') {
    await route(page, ['Enter', 'Enter']);
    const lockedAfter = await page.locator('.chapter-stage.locked').count();
    if (lockedAfter !== 3) errors.push(`chapter: expected 3 locked stages after clear, got ${lockedAfter}`);
  }

  // Secondary screens via map shortcuts.
  for (const [key, name] of [['T', 'trials'], ['C', 'codex'], ['P', 'progress'], ['S', 'settings']]) {
    await route(page, ['Enter', key]);
    await audit(page, vp, name, phone);
  }
  await ctx.close();
}
await browser.close();
server.close();
writeFileSync(join(root, 'docs', 'UX_AUDIT.json'), JSON.stringify({ report, errors }, null, 2));
const bad = report.filter((r) => r.overflow.length);
console.log(`audited ${report.length} screen/viewports; ${bad.length} with overflow; ${errors.length} page errors`);
for (const r of bad) console.log(`${r.viewport} ${r.screen}: ${r.overflow.slice(0, 3).join(' | ')}`);
if (errors.length) console.log('errors:', errors.slice(0, 5));
if (bad.length || errors.length) process.exit(1);
