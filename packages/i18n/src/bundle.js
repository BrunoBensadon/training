/**
 * How a directory of locale files becomes locale bundles.
 *
 * Layout:
 *   locales/<locale>/<namespace>.json   ->  bundles[locale][namespace]
 *
 * e.g. locales/pt-BR/items.json becomes bundles['pt-BR'].items, reachable
 * as the key "items.sets.0.statements.1.text".
 *
 * Splitting a locale across files is what lets the assessment items be
 * reviewed, and revised, as a unit separate from interface copy.
 *
 * Plain JavaScript so the Vite plugin (Node, reading from disk) and the
 * app (browser, reading from import.meta.glob) agree by construction.
 *
 * @typedef {import('./parity.js').Messages} Messages
 */

/**
 * @param {string} path
 * @returns {{ locale: string, namespace: string } | null}
 */
export function describeLocalePath(path) {
  const parts = path.split('/').filter(Boolean);
  const file = parts[parts.length - 1];
  const dir = parts[parts.length - 2];
  if (!file || !dir || !file.endsWith('.json')) return null;
  return { locale: dir, namespace: file.slice(0, -'.json'.length) };
}

/**
 * @param {Record<string, Messages>} files path -> parsed JSON
 * @returns {Record<string, Messages>} locale -> bundle
 */
export function buildBundles(files) {
  /** @type {Record<string, Messages>} */
  const bundles = {};
  for (const [path, contents] of Object.entries(files)) {
    const described = describeLocalePath(path);
    if (!described) continue;
    const { locale, namespace } = described;
    bundles[locale] ??= {};
    bundles[locale][namespace] = contents;
  }
  return bundles;
}
