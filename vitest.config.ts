import { defineConfig } from 'vitest/config';
import { aliasEntries } from './scripts/workspace.mjs';

export default defineConfig({
  resolve: { alias: aliasEntries() },
  test: {
    // Files needing a DOM opt in with `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
  },
});
