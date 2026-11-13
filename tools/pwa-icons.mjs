/**
 * Regenerate PWA PNG icons from vector masters. Dev-only; requires Playwright
 * (`npm run browser:setup`). Committed PNGs mean a normal build needs no browser.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(new URL('..', import.meta.url).pathname);
const sets = [
  { src: 'public/icons/icon.svg', out: 'public/icons/icon-192.png', size: 192 },
  { src: 'public/icons/icon.svg', out: 'public/icons/icon-512.png', size: 512 },
  { src: 'public/icons/icon.svg', out: 'public/icons/icon-maskable-512.png', size: 512, pad: 0.82 },
  { src: 'public/icons/icon.svg', out: 'public/icons/apple-touch-icon.png', size: 180 },
  { src: 'public/icons/favicon.svg', out: 'public/icons/favicon-32.png', size: 32 },
  { src: 'public/icons/favicon.svg', out: 'public/icons/favicon-16.png', size: 16 },
];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
for (const item of sets) {
  const svg = readFileSync(resolve(root, item.src), 'utf8');
  const data = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const inner = Math.round(item.size * (item.pad ?? 1));
  const page = await browser.newPage({ viewport: { width: item.size, height: item.size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#04110a;display:grid;place-items:center}img{display:block;width:${inner}px;height:${inner}px}</style><img src="${data}">`);
  await page.screenshot({ path: resolve(root, item.out) });
  await page.close();
  console.log(item.out, readFileSync(resolve(root, item.out)).length);
}
await browser.close();
