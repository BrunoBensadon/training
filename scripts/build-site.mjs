#!/usr/bin/env node
/**
 * Builds the whole site into dist-site/.
 *
 *   dist-site/index.html          the index, from apps/home
 *   dist-site/<tool-id>/          one directory per tool in tools.config.json
 *
 * That layout is what GitHub Pages serves, and it is why each app needs a
 * Vite base matching where it lands. Nothing here knows the names of the
 * tools: adding one to tools.config.json is enough.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { repoRoot, siteBase, toolBase, tools } from './workspace.mjs';

const OUT = path.join(repoRoot, 'dist-site');

function build(dir) {
  const config = path.join(repoRoot, dir, 'vite.config.ts');
  execFileSync(
    process.execPath,
    [path.join(repoRoot, 'node_modules/vite/bin/vite.js'), 'build', path.join(repoRoot, dir), '--config', config],
    { stdio: 'inherit', cwd: repoRoot },
  );
  return path.join(repoRoot, dir, 'dist');
}

function copyInto(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

console.log(`\n→ site root: ${siteBase()}\n`);

console.log('── index ──────────────────────────────────────────────');
copyInto(build('apps/home'), OUT);

for (const tool of tools()) {
  console.log(`\n── ${tool.id} ${'─'.repeat(Math.max(0, 46 - tool.id.length))}`);
  console.log(`   serving at ${toolBase(tool.id)}`);
  copyInto(build(tool.dir), path.join(OUT, tool.id));
}

// GitHub Pages runs Jekyll over the output unless told not to, and Jekyll
// drops files and directories beginning with an underscore.
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`\n✓ site assembled in dist-site/\n`);
for (const entry of fs.readdirSync(OUT)) console.log(`   ${entry}`);
