/**
 * Shared build wiring for every app in this monorepo.
 *
 * The deployed site is one GitHub Pages site with each tool under its own
 * path, so every app needs a Vite `base` that matches where it will be
 * served. That value is derived here, from tools.config.json, rather than
 * being repeated in each app's config, its index.html and its CI job.
 *
 * Overrides, in order of precedence:
 *   BASE_PATH  — set the base outright (use for one-off preview deploys)
 *   SITE_BASE  — change the site root only, keeping the /<tool-id>/ suffix
 *                (a fork served from https://<user>.github.io/<other-name>/)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const toolsConfig = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'tools.config.json'), 'utf8'),
);

/** Trailing-slashed site root, e.g. "/training/". */
export function siteBase() {
  const raw = process.env.SITE_BASE ?? toolsConfig.siteBase ?? '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

/**
 * Where a tool is served in production, e.g. "/training/elc-placement/".
 * Pass toolId `null` for the site index itself.
 */
export function toolBase(toolId) {
  if (process.env.BASE_PATH) {
    const raw = process.env.BASE_PATH;
    return raw.endsWith('/') ? raw : `${raw}/`;
  }
  return toolId ? `${siteBase()}${toolId}/` : siteBase();
}

/**
 * Vite `base` for a given command. `vite dev` serves one app at the server
 * root, so the production path prefix must not apply there.
 */
export function viteBase(toolId, command) {
  return command === 'serve' ? '/' : toolBase(toolId);
}

/**
 * Workspace packages are consumed as TypeScript source rather than built
 * output, so there is no build-order dependency between packages/ and apps/.
 * Vite and Vitest both need to be told where they live.
 */
export const workspaceAliases = {
  '@training/ui/styles': path.join(repoRoot, 'packages/ui/styles'),
  '@training/ui': path.join(repoRoot, 'packages/ui/src/index.ts'),
  '@training/i18n': path.join(repoRoot, 'packages/i18n/src/index.ts'),
};

/** Alias entries in Vite's array form, longest key first so prefixes win. */
export function aliasEntries() {
  return Object.entries(workspaceAliases)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([find, replacement]) => ({ find, replacement }));
}

export function tools() {
  return toolsConfig.tools ?? [];
}
