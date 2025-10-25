/* Service worker: robust precache + network-first navigations (with offline.html) */
const CACHE = 't2d-dashboard-v3'; // ⬅️ bump on every deploy

// Root-anchored paths so they resolve from any route.
const PRECACHE_URLS = [
  '/',                  
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',          // ⬅️ now precached
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // 1) Navigations: network-first, fall back to cached shell, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match('/')) 
              || (await cache.match('/index.html')) 
              || (await cache.match('/offline.html'));
        }
      })()
    );
    return;
  }

  // 2) Same-origin assets: cache-first with background fill
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const resp = await fetch(request);
        caches.open(CACHE).then((c) => c.put(request, resp.clone()));
        return resp;
      })()
    );
    return;
  }

  // 3) Cross-origin: network (customize if you want CDN/API caching)
  event.respondWith(fetch(request));
});
