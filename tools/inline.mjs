/**
 * Post-build: inline the JS + CSS into a single self-contained index.html so the
 * game can be emailed, opened from a USB stick, or hosted anywhere.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const dist = 'dist';
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const assets = readdirSync(join(dist, 'assets'));
for (const name of assets) {
  const path = join(dist, 'assets', name);
  const body = readFileSync(path, 'utf8');
  if (extname(name) === '.js') {
    html = html.replace(new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`), `<script type="module">${body.replace(/<\/script>/g, '<\\/script>')}</script>`);
  } else if (extname(name) === '.css') {
    html = html.replace(new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`), `<style>${body}</style>`);
  }
}

writeFileSync(join(dist, 'vimlore.html'), html);
mkdirSync('dist/download', { recursive: true });
copyFileSync(join(dist, 'vimlore.html'), 'dist/download/vimlore.html');
console.log(`single file: dist/vimlore.html (${(statSync(join(dist, 'vimlore.html')).size / 1024).toFixed(1)} kB)`);
