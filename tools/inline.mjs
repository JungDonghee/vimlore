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
    const tag = `<script type="module">${body.replace(/<\/script>/g, '<\\/script>')}</script>`;
    html = html.replace(new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`), () => tag);
  } else if (extname(name) === '.css') {
    const tag = `<style>${body}</style>`;
    html = html.replace(new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`), () => tag);
  }
}

// The downloadable single-file build stays self-contained: PWA shell tags
// point at sibling files that are not inlined and must be stripped.
html = html.replace(/<!-- pwa:start[\s\S]*?pwa:end -->\n?/g, '');
writeFileSync(join(dist, 'vimlore.html'), html);
mkdirSync('dist/download', { recursive: true });
copyFileSync(join(dist, 'vimlore.html'), 'dist/download/vimlore.html');
console.log(`single file: dist/vimlore.html (${(statSync(join(dist, 'vimlore.html')).size / 1024).toFixed(1)} kB)`);
