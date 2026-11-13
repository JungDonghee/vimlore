/**
 * Public-presentation guard: README images, social card, OG tags.
 * Runs in CI; does not need a browser or GitHub token.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const fail = [];
const need = (rel) => {
  const p = join(root, rel);
  if (!existsSync(p)) fail.push(`missing ${rel}`);
  return p;
};
const read = (rel) => readFileSync(need(rel));

// PNG dimensions
const png = (rel) => {
  const b = read(rel);
  if (b.toString('ascii', 1, 4) !== 'PNG') { fail.push(`${rel} is not PNG`); return [0, 0]; }
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
// JPEG dimensions
const jpeg = (rel) => {
  const b = read(rel);
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  fail.push(`${rel} has no JPEG size`);
  return [0, 0];
};

const hero = jpeg('docs/hero.jpg');
const social = png('docs/social-preview.png');
const socialPublic = png('public/social-preview.png');
const icon = png('public/icons/icon-512.png');
if (hero[0] !== 1200 || hero[1] !== 680) fail.push(`hero must be 1200x680, got ${hero.join('x')}`);
if (social[0] !== 1280 || social[1] !== 640) fail.push(`social preview must be 1280x640, got ${social.join('x')}`);
if (social[0] !== socialPublic[0] || social[1] !== socialPublic[1]) fail.push('public/social-preview.png differs in size');
if (icon[0] !== 512 || icon[1] !== 512) fail.push(`icon-512 must be 512x512, got ${icon.join('x')}`);
if (statSync(join(root, 'docs/social-preview.png')).size > 1_000_000) fail.push('social preview exceeds GitHub 1 MB');

const readme = readFileSync(join(root, 'README.md'), 'utf8');
for (const token of ['docs/hero.jpg', 'docs/browser/pwa/landscape-title.png', 'docs/browser/pwa/portrait-gate.png', 'docs/COMPLETION.md', 'docs/COMPARISON.md', 'Current state', '~67%', '~90%']) {
  if (!readme.includes(token)) fail.push(`README missing: ${token}`);
}
const index = readFileSync(join(root, 'index.html'), 'utf8');
for (const token of ['og:title', 'og:image', 'social-preview.png', 'twitter:card']) {
  if (!index.includes(token)) fail.push(`index.html missing ${token}`);
}
if (!index.includes('https://jungdonghee.github.io/vimlore/social-preview.png')) fail.push('OG image must use the absolute Pages URL');

if (fail.length) {
  console.error('PRESENTATION CHECK FAILED');
  for (const f of fail) console.error(' -', f);
  process.exit(1);
}
console.log(`presentation: hero ${hero.join('x')}, social ${social.join('x')}, README/OG links OK`);
