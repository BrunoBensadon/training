/**
 * Locale-file comparison.
 *
 * Plain JavaScript with JSDoc types, deliberately: the same code runs
 * inside the bundle (imported by `index.ts`), inside the test suite, and
 * inside the Vite plugin that fails a build on drift. A second Node-only
 * copy of this logic would be the thing that drifts.
 *
 * @typedef {string | number | boolean | null | MessageValue[] | { [key: string]: MessageValue }} MessageValue
 * @typedef {{ [key: string]: MessageValue }} Messages
 */

/**
 * Flattens a locale bundle to `path -> leaf value`.
 *
 * Arrays flatten by index, so a locale that is missing the fourth
 * statement of set 3 shows up as a missing key rather than as a runtime
 * `undefined` in front of a room.
 *
 * @param {Messages} messages
 * @param {string} [prefix]
 * @param {Record<string, string | number | boolean | null>} [out]
 * @returns {Record<string, string | number | boolean | null>}
 */
export function flatten(messages, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const itemPath = `${path}.${index}`;
        if (item !== null && typeof item === 'object') {
          flatten(/** @type {Messages} */ (item), itemPath, out);
        } else {
          out[itemPath] = /** @type {string | number | boolean | null} */ (item);
        }
      });
    } else if (value !== null && typeof value === 'object') {
      flatten(/** @type {Messages} */ (value), path, out);
    } else {
      out[path] = /** @type {string | number | boolean | null} */ (value);
    }
  }
  return out;
}

/**
 * The `{placeholders}` a string expects, sorted and de-duplicated.
 * @param {unknown} value
 * @returns {string[]}
 */
export function placeholders(value) {
  if (typeof value !== 'string') return [];
  const found = new Set();
  for (const match of value.matchAll(/\{(\w+)\}/g)) found.add(match[1]);
  return [...found].sort();
}

/**
 * @typedef {object} ParityProblem
 * @property {string} locale
 * @property {'missing-key' | 'extra-key' | 'empty-value' | 'placeholder-mismatch' | 'type-mismatch'} kind
 * @property {string} key
 * @property {string} detail
 */

/**
 * Compares every locale against a reference locale.
 *
 * Checks, in order of how much damage they do in a training room:
 *  - missing keys        — a blank where a statement should be
 *  - extra keys          — a translated string nothing will ever show
 *  - empty values        — a half-finished translation that looks finished
 *  - placeholder drift   — "{n} of {total}" losing a number
 *  - type drift          — a string where the app expects a list
 *
 * @param {Record<string, Messages>} bundles keyed by locale code
 * @param {string} reference locale code every other locale is compared to
 * @returns {ParityProblem[]}
 */
export function compareLocales(bundles, reference) {
  const referenceBundle = bundles[reference];
  if (!referenceBundle) {
    throw new Error(
      `reference locale "${reference}" is not among the bundles: ${Object.keys(bundles).join(', ') || '(none)'}`,
    );
  }

  const referenceFlat = flatten(referenceBundle);
  const referenceKeys = Object.keys(referenceFlat);
  /** @type {ParityProblem[]} */
  const problems = [];

  for (const key of referenceKeys) {
    const value = referenceFlat[key];
    if (typeof value === 'string' && value.trim() === '') {
      problems.push({
        locale: reference,
        kind: 'empty-value',
        key,
        detail: 'the reference locale itself has an empty string here',
      });
    }
  }

  for (const [locale, bundle] of Object.entries(bundles)) {
    if (locale === reference) continue;
    const flat = flatten(bundle);
    const keys = new Set(Object.keys(flat));

    for (const key of referenceKeys) {
      if (!keys.has(key)) {
        problems.push({
          locale,
          kind: 'missing-key',
          key,
          detail: `present in "${reference}", absent here`,
        });
        continue;
      }

      const theirs = flat[key];
      const ours = referenceFlat[key];

      if (typeof theirs === 'string' && theirs.trim() === '') {
        problems.push({ locale, kind: 'empty-value', key, detail: 'translated to an empty string' });
      }

      if (typeof theirs !== typeof ours) {
        problems.push({
          locale,
          kind: 'type-mismatch',
          key,
          detail: `"${reference}" has ${typeof ours}, this locale has ${typeof theirs}`,
        });
        continue;
      }

      const expected = placeholders(ours);
      const actual = placeholders(theirs);
      if (expected.join('|') !== actual.join('|')) {
        problems.push({
          locale,
          kind: 'placeholder-mismatch',
          key,
          detail: `expects ${expected.length ? expected.map((p) => `{${p}}`).join(' ') : '(none)'}, has ${actual.length ? actual.map((p) => `{${p}}`).join(' ') : '(none)'}`,
        });
      }
    }

    for (const key of keys) {
      if (!(key in referenceFlat)) {
        problems.push({
          locale,
          kind: 'extra-key',
          key,
          detail: `not present in "${reference}", so nothing will ever show it`,
        });
      }
    }
  }

  return problems;
}

/**
 * Turns problems into something a contributor can act on.
 * @param {ParityProblem[]} problems
 * @returns {string}
 */
export function formatProblems(problems) {
  if (problems.length === 0) return 'locale files agree';
  const byLocale = new Map();
  for (const problem of problems) {
    const list = byLocale.get(problem.locale) ?? [];
    list.push(problem);
    byLocale.set(problem.locale, list);
  }
  const lines = [`${problems.length} locale problem(s):`];
  for (const [locale, list] of byLocale) {
    lines.push(`  ${locale}`);
    for (const problem of list) {
      lines.push(`    [${problem.kind}] ${problem.key} — ${problem.detail}`);
    }
  }
  lines.push('');
  lines.push('See docs/CONTRIBUTING-TRANSLATIONS.md.');
  return lines.join('\n');
}

/**
 * Throws unless every locale matches the reference.
 * @param {Record<string, Messages>} bundles
 * @param {string} reference
 */
export function assertLocaleParity(bundles, reference) {
  const problems = compareLocales(bundles, reference);
  if (problems.length > 0) throw new Error(formatProblems(problems));
}
