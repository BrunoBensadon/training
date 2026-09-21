import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import { localeParity } from '@training/i18n/vite';
import { aliasEntries, viteBase } from '../../scripts/workspace.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  // The index sits at the site root, so it has no tool id.
  base: viteBase(null, command),
  resolve: { alias: aliasEntries() },
  plugins: [localeParity({ dir: path.join(here, 'locales'), reference: 'en' })],
  build: { target: 'es2022', cssCodeSplit: false, sourcemap: false },
  server: { port: 5174 },
}));
