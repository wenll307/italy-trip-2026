
const CACHE = 'italy-trip-2026-v31';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(['./', './index.html']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key.startsWith('italy-trip-2026-') && key !== CACHE) {
        await caches.delete(key);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Supabase 云端数据不缓存为公开网页资源。
  if (url.hostname.endsWith('.supabase.co')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache =>
              cache.put('./index.html', copy)
            );
          }
          return response;
        })
        .catch(async () =>
          (await caches.match('./index.html')) ||
          Response.error()
        )
    );
    return;
  }

  if (url.origin === self.location.origin ||
      url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;

        return fetch(event.request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache =>
              cache.put(event.request, copy)
            );
          }
          return response;
        });
      })
    );
  }
});
