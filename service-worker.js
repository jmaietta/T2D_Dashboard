/* Service worker: precache + network-first navigations + INSTANT update flow */
// 1. BUMP THIS VERSION to force the browser to dump the old cache
const CACHE = 't2d-dashboard-v5'; 

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
  // 2. UNCOMMENTED: Force this new worker to activate immediately
  self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  // 3. Claim control of the page immediately
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations: network-first, then shell, then offline page
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Try the network first (Get the NEW index.html)
        return await fetch(request);
      } catch {
        // If offline, fallback to cache
        const cache = await caches.open(CACHE);
        return (await cache.match('/'))
            || (await cache.match('/index.html'))
            || (await cache.match('/offline.html'));
      }
    })());
    return;
  }

  // Same-origin assets: cache-first with background fill
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

  // Cross-origin: fetch
  event.respondWith(fetch(request));
});
