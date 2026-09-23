/**
 * Registers the offline cache.
 *
 * Only in a production build: in dev a service worker serving stale assets
 * is a debugging trap, not a feature. Registration is deferred to `load`
 * so it never competes with first paint, and a failure is silent because
 * an app that works online and not offline is still a working app.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const base = import.meta.env.BASE_URL;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* offline support is a bonus, not a requirement */
    });
  });
}
