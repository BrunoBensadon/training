/**
 * Emits a service worker that precaches exactly what the build produced.
 *
 * Most trainees are on phones and some are on poor connections, so a tool
 * has to survive a reload in a basement. The generated worker caches the
 * build's own files and nothing else, and refuses cross-origin requests
 * outright — a service worker is the one place a third-party request could
 * be added without it showing up in the page source.
 *
 * Shared, because tool #2 will want the same thing.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {object} options
 * @param {string} options.template absolute path to the worker source
 * @param {string} [options.fileName] emitted name, default "sw.js"
 * @returns {import('vite').Plugin}
 */
export function serviceWorker(options) {
  const { template, fileName = 'sw.js' } = options;
  let base = '/';

  return {
    name: 'training:service-worker',
    apply: 'build',

    configResolved(config) {
      base = config.base;
    },

    // writeBundle rather than generateBundle: by this point index.html has
    // definitely been emitted by Vite's own HTML plugin, so the precache
    // list is the complete build rather than whatever existed when plugin
    // ordering happened to run us.
    writeBundle(outputOptions, bundle) {
      const files = Object.keys(bundle)
        .filter((name) => !name.endsWith('.map') && name !== fileName)
        .sort();

      // The navigation URL first: the worker serves it for every
      // navigation, which is what makes the hash routes work offline.
      const urls = [
        base,
        ...files.filter((name) => name !== 'index.html').map((name) => `${base}${name}`),
      ];

      const cacheName = `elc-${createHash('sha256').update(urls.join('|')).digest('hex').slice(0, 10)}`;

      const source = fs
        .readFileSync(template, 'utf8')
        .replaceAll('__PRECACHE__', JSON.stringify(urls))
        .replaceAll('__CACHE_NAME__', cacheName);

      if (source.includes('__PRECACHE__') || source.includes('__CACHE_NAME__')) {
        throw new Error('service worker template still contains unsubstituted placeholders');
      }

      const outDir = outputOptions.dir ?? 'dist';
      fs.writeFileSync(path.join(outDir, fileName), source, 'utf8');
    },
  };
}

export default serviceWorker;
