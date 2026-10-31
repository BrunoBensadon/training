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

/**
 * How long a page load waits for the network before falling back to the
 * cached copy. Long enough for a slow phone connection, short enough that
 * a basement with one bar of signal still opens the app.
 */
const NETWORK_TIMEOUT_MS = 3000;

/**
 * Page loads are network-first. Serving the cached page first meant that
 * after every deploy, anyone who had opened the tool before saw the *old*
 * version — the new worker only installs in the background during that
 * visit — and got the new one only on the visit after. With network-first
 * the fresh page arrives straight away and asks for the new build's files,
 * which this worker does not have yet and so fetches. Offline, or when the
 * network is too slow, the cached page is used exactly as before.
 *
 * The fresh page is deliberately not written into the cache here: the
 * cache must hold one complete build, and the next worker precaches the
 * new one whole.
 */
function pageFromNetworkOrCache(request) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (response) => {
      if (settled || !response) return;
      settled = true;
      resolve(response);
    };
    const fromCache = () => caches.match(INDEX);

    const timer = setTimeout(() => fromCache().then(settle), NETWORK_TIMEOUT_MS);
    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        settle(response);
      })
      .catch(() => {
        clearTimeout(timer);
        fromCache().then((hit) => settle(hit || Response.error()));
      });
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(pageFromNetworkOrCache(request));
    return;
  }

  // Build files have content hashes in their names, so a cached one is
  // never stale: cache first.
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
