// Service worker for the games site.
// Caches the animal-game images (animals-img/*) with a cache-first strategy so
// they load instantly on repeat visits and work offline once seen.
const CACHE = 'animals-img-v1';

self.addEventListener('install', () => {
  // Activate this worker immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Drop any old cache versions when CACHE is bumped.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle GET requests for the animal images; everything else goes to network.
  if (event.request.method !== 'GET' || !url.pathname.includes('/animals-img/')) {
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      // Cache successful (and opaque, just in case) responses for next time.
      if (response && (response.status === 200 || response.type === 'opaque')) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});
