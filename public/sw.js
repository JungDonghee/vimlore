/* VIMLORE service worker: installable, offline shell, no third-party requests. */
const VERSION = 'vimlore-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa.css',
  './pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // The app is a Vite shell; cache the hashed JS/CSS too so the first offline
    // reload works even though the SW only claims clients after activation.
    const indexURL = new URL('./index.html', self.registration.scope).href;
    const html = await (await fetch(indexURL, { cache: 'reload' })).text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((m) => new URL(m[1], self.registration.scope).href)
      .filter((url) => url.startsWith(self.registration.scope) && !url.endsWith('/sw.js'));
    await cache.addAll([...new Set(assets)]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
            (await caches.match(new URL('./', self.registration.scope).href)) ||
            (await caches.match(new URL('./index.html', self.registration.scope).href)) ||
            new Response('VIMLORE is offline. Reconnect once to cache the game.', {
              status: 503,
              headers: { 'content-type': 'text/plain; charset=utf-8' },
            });
        }),
    );
    return;
  }

  // Hashed assets are immutable; the unhashed PWA shell and base HTML are
  // network-revalidated in the background. Cache-first keeps the game instant.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
