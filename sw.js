// NPK Radar service worker — shell cache-first, data network-first. Build: 202609240508
const SHELL = 'npk-shell-202609240508';
const PRECACHE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-180.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const same = url.origin === location.origin;
  const isNav = e.request.mode === 'navigate' || (same && (url.pathname.endsWith('/') || url.pathname.endsWith('.html')));
  const isData = same && url.pathname.endsWith('.json');
  if (isNav || isData) {
    // NETWORK-FIRST for the page and its data: a fresh open always gets the newest build;
    // the cache is only the offline fallback.
    e.respondWith(fetch(url.href, { cache: 'no-store', credentials: 'same-origin' }).then((r) => {
      if (r && r.ok) { const c = r.clone(); caches.open(SHELL).then((x) => x.put(e.request, c)); }
      return r;
    }).catch(() => caches.match(e.request).then((hit) => hit || (isNav ? caches.match('./index.html') : undefined))));
    return;
  }
  // static assets (fonts and icons): cache-first. D3 is embedded in index.html.
  const cacheable = same || /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r && (r.ok || r.type === 'opaque') && cacheable) { const c = r.clone(); caches.open(SHELL).then((x) => x.put(e.request, c)); }
    return r;
  }).catch(() => hit)));
});
