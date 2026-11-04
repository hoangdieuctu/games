// Service worker của Thế Giới Nhỏ: lưu đệm trang, tài sản và Phaser để chơi được khi không có mạng.
// Trang và manifest: mạng trước (luôn lấy bản mới nếu có mạng). Ảnh, font, Phaser: đệm trước.
const CACHE = 'little-world-v3';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('little-world-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isLib = /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!sameOrigin && !isLib) return;
  const networkFirst = sameOrigin && (req.mode === 'navigate' || /\.(html|json)$/.test(url.pathname));
  if (networkFirst) {
    e.respondWith(fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((ch) => ch.put(req, c)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true })));
  } else {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then((ch) => ch.put(req, c)); }
      return res;
    })));
  }
});
