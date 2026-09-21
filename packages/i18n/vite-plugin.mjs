/**
 * Fails the build when locale files drift apart.
 *
 * Adding a locale is meant to be one directory and a pull request, which
 * only works if a half-finished locale cannot reach production. This runs
 * at buildStart and again whenever a locale file changes in dev, so a
 * translator working locally sees the same message CI would print.
 */
import fs from 'node:fs';
import path from 'node:path';

import { assertLocaleParity } from './src/parity.js';
import { buildBundles } from './src/bundle.js';

/**
 * @param {object} options
 * @param {string} options.dir absolute path to the locales directory
 * @param {string} [options.reference] locale every other locale must match
 * @returns {import('vite').Plugin}
 */
export function localeParity(options) {
  const { dir, reference = 'en' } = options;

  const read = () => {
    /** @type {Record<string, unknown>} */
    const files = {};
    for (const locale of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!locale.isDirectory()) continue;
      const localeDir = path.join(dir, locale.name);
      for (const file of fs.readdirSync(localeDir)) {
        if (!file.endsWith('.json')) continue;
        const full = path.join(localeDir, file);
        try {
          files[`${locale.name}/${file}`] = JSON.parse(fs.readFileSync(full, 'utf8'));
        } catch (cause) {
          throw new Error(`${full} is not valid JSON: ${cause.message}`);
        }
      }
    }
    return buildBundles(files);
  };

  const check = () => {
    const bundles = read();
    const locales = Object.keys(bundles);
    if (locales.length === 0) throw new Error(`no locale directories found in ${dir}`);
    assertLocaleParity(bundles, reference);
    return locales;
  };

  return {
    name: 'training:locale-parity',
    enforce: 'pre',

    buildStart() {
      const locales = check();
      this.info?.(`locale files agree across ${locales.length}: ${locales.join(', ')}`);
    },

    configureServer(server) {
      server.watcher.add(dir);
      const onChange = (file) => {
        if (!file.startsWith(dir) || !file.endsWith('.json')) return;
        try {
          check();
        } catch (error) {
          server.config.logger.error(`\n[locale-parity] ${error.message}\n`);
        }
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}

export default localeParity;
