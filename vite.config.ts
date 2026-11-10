import { defineConfig } from 'vite';

/**
 * base: './' is load-bearing: GitHub Pages serves the site under
 * /vimlore/ (a subpath), so absolute asset URLs (/assets/…) 404 and the page
 * renders blank. Relative URLs work at any depth, including file://.
 * The CI workflow greps the built index.html to keep this from regressing.
 */
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
  },
});
