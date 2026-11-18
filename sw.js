// Keeps the app itself available offline. Sheet data never goes through this cache:
// the app keeps its own last saved copy, and requests to Google are left alone.
const CACHE = 'sidniverse-app-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const store = (res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };
  if (req.mode === 'navigate') {
    // Newest page when online, saved page when offline.
    event.respondWith(fetch(req).then(store).catch(() => caches.match(req).then((hit) => hit || caches.match(self.registration.scope))));
    return;
  }
  // Built files have the content hash in their name, so a saved copy is always right.
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(store)));
});
