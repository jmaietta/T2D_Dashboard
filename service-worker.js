/* Service worker: precache + network-first navigations + polite update flow */
const CACHE = 't2d-dashboard-v4'; // ⬅️ bump this on each deploy

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
  // Removed self.skipWaiting() so the new SW waits politely until user confirms
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Listen for page request to activate immediately (used by the toast button)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // 1) Navigations: network-first, then shell, then offline page
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match('/'))
            || (await cache.match('/index.html'))
            || (await cache.match('/offline.html'));
      }
    })());
    return;
  }

  // 2) Same-origin assets: cache-first with background fill
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const resp = await fetch(request);
      caches.open(CACHE).then((c) => c.put(request, resp.clone()));
      return resp;
    })());
    return;
  }

  // 3) Cross-origin: fetch (customize caching if desired)
  event.respondWith(fetch(request));
});
