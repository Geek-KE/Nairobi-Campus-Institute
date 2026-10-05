// Nairobi Campus Institute service worker
// Network-first: the app always tries to load the newest files from the server.
// The saved copy is only used when the phone is offline.
const CACHE = 'nci-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate the new worker right away
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()) // take control of open pages
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only handle files from our own site. Supabase, fonts, EmailJS etc. go straight to the network.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : undefined))
      )
  );
});
