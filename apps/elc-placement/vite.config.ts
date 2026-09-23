import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { localeParity } from '@training/i18n/vite';
import { aliasEntries, viteBase } from '../../scripts/workspace.mjs';
import { serviceWorker } from '../../scripts/service-worker-plugin.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ID = 'elc-placement';

export default defineConfig(({ command }) => ({
  // Derived from tools.config.json, not written out here — see
  // scripts/workspace.mjs and docs/ADDING-A-TOOL.md.
  base: viteBase(TOOL_ID, command),
  resolve: { alias: aliasEntries() },
  plugins: [
    localeParity({ dir: path.join(here, 'locales'), reference: 'en' }),
    serviceWorker({ template: path.join(here, 'src/sw/service-worker.js') }),
  ],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    sourcemap: false,
    // Self-hosted fonts must stay separate files; inlining them as data
    // URIs would bloat the first byte for no gain.
    assetsInlineLimit: 2048,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
}));
