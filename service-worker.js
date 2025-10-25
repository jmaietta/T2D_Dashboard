/* Service worker with simple caching */
const CACHE_NAME = 't2d-dashboard-v1';
const ASSETS = ['./','./tradingview_pwa.html','./manifest.webmanifest','./offline.html','./android-chrome-192x192.png','./android-chrome-512x512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    if (request.mode === 'navigate' || request.destination === 'document') {
      event.respondWith(fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return resp;
      }).catch(() => caches.match(request).then(r => r || caches.match('./offline.html'))));
    } else {
      event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return resp;
      })));
    }
  } else {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
