// Service Worker: macht die Seite installierbar und zeigt offline den letzten Stand.
const CACHE = 'spritpreise-v1';
const CORE = ['./', './index.html', './config.json', './manifest.webmanifest', './icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

const store = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.e-control.at') return; // Live-Preise nie aus dem Cache

  if (url.origin === self.location.origin) {
    // Eigene Dateien: immer zuerst frisch aus dem Netz, offline aus dem Cache
    e.respondWith(fetch(req).then(res => store(req, res)).catch(() => caches.match(req, { ignoreSearch: true })));
  } else {
    // Schriften und Diagramm-Bibliothek (feste Versionen): zuerst aus dem Cache
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => store(req, res))));
  }
});
