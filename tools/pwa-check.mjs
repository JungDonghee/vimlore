/**
 * Deterministic PWA shell check (no browser). Runs after `npm run build` in CI.
 * Installability is user-agent policy; this proves the installed assets,
 * manifest fields and single-file split are present and consistent.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

for (const file of ['manifest.webmanifest', 'sw.js', 'pwa.js', 'pwa.css', 'icons/icon.svg', 'icons/favicon.svg', 'icons/favicon-32.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png']) {
  ok(existsSync(join(dist, file)), `missing dist/${file}`);
}

let manifest = null;
try { manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8')); } catch (e) { fails.push(`manifest parse: ${e.message}`); }
if (manifest) {
  ok(manifest.display === 'standalone', 'manifest display must be standalone');
  ok(manifest.orientation === 'landscape', 'manifest orientation must be landscape');
  ok(manifest.start_url === './', 'manifest start_url must be ./');
  ok(manifest.scope === './', 'manifest scope must be ./');
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const sizes = new Set(icons.map((i) => i.sizes));
  ok(sizes.has('192x192'), 'manifest needs a 192x192 icon');
  ok(sizes.has('512x512'), 'manifest needs a 512x512 icon');
  ok(icons.some((i) => i.purpose === 'maskable'), 'manifest needs a maskable icon');
  for (const icon of icons) {
    const path = join(dist, icon.src.replace(/^\.\//, ''));
    ok(existsSync(path), `missing manifest icon ${icon.src}`);
    if (existsSync(path) && icon.sizes !== 'any') {
      const buf = readFileSync(path);
      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
      ok(`${w}x${h}` === icon.sizes, `icon ${icon.src} is ${w}x${h}, manifest says ${icon.sizes}`);
    }
  }
}

const index = readFileSync(join(dist, 'index.html'), 'utf8');
ok(index.includes('rel="manifest"'), 'dist/index.html lacks manifest link');
ok(index.includes('pwa.js'), 'dist/index.html lacks pwa.js');
ok(index.includes('pwa.css'), 'dist/index.html lacks pwa.css');
const single = readFileSync(join(dist, 'vimlore.html'), 'utf8');
ok(!/rel="manifest"|src="\.\/pwa\.js"|href="\.\/pwa\.css"/.test(single), 'dist/vimlore.html must stay self-contained (PWA tags not stripped)');

const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
ok(sw.includes("'./index.html'"), 'SW shell misses index.html');
ok(sw.includes('cache.addAll'), 'SW does not pre-cache');
ok(/matchAll\(.*src\|href/.test(sw) || sw.includes('matchAll'), 'SW does not discover hashed assets');

if (fails.length) {
  console.error('PWA CHECK FAILED');
  for (const f of fails) console.error(' -', f);
  process.exit(1);
}
console.log('pwa: manifest landscape, icons, shell cache and single-file split OK');
