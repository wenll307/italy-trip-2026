
const CACHE = 'italy-trip-2026-v32';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['./', './index.html']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('italy-trip-2026-') && k !== CACHE) {
        await caches.delete(k);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname.endsWith('.supabase.co')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c =>
              c.put('./index.html', clone)
            );
          }
          return r;
        })
        .catch(async () =>
          await caches.match('./index.html') || Response.error()
        )
    );
    return;
  }

  if (url.hostname === 'cdn.jsdelivr.net' ||
      url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(r => {
          if (r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then(c =>
              c.put(req, copy)
            );
          }
          return r;
        })
      )
    );
  }
});
