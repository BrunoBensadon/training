/**
 * Offline support.
 *
 * Most trainees are on phones and some are on bad connections, so the app
 * has to survive a reload in a basement training room. Everything the app
 * needs is precached on first visit; after that nothing is fetched at all.
 *
 * The fetch handler refuses cross-origin requests outright. Nothing in
 * this app makes any, and a service worker is exactly the place where one
 * could be added without anyone noticing.
 *
 * The two placeholders below are substituted at build time with the real
 * asset list and a cache name derived from it, so a new deploy invalidates
 * the old cache instead of serving last month's items forever. See
 * scripts/service-worker-plugin.mjs.
 */
const CACHE_NAME = '__CACHE_NAME__';
const PRECACHE = __PRECACHE__;
const INDEX = PRECACHE[0];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(caches.match(INDEX).then((hit) => hit || fetch(request)));
    return;
  }

  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
