// NPK Radar service worker — shell cache-first, data network-first. Build: 202609181711
const SHELL = 'npk-shell-202609181711';
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
  const isData = url.origin === location.origin && url.pathname.endsWith('.json');
  if (isData) {
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(SHELL).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  const cacheable = url.origin === location.origin || /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r && (r.ok || r.type === 'opaque') && cacheable) { const c = r.clone(); caches.open(SHELL).then((x) => x.put(e.request, c)); }
    return r;
  }).catch(() => hit)));
});
