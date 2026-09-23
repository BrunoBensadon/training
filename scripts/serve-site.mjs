#!/usr/bin/env node
/**
 * A static file server for dist-site/, used by the browser checks and
 * handy for looking at the built site locally:
 *
 *   npm run build && node scripts/serve-site.mjs
 *
 * It serves under the real site base (/training/ by default) so that the
 * base-path wiring is exercised rather than bypassed.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { repoRoot, siteBase } from './workspace.mjs';

const ROOT = path.join(repoRoot, 'dist-site');
const BASE = siteBase();
const PORT = Number(process.env.PORT ?? 4178);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (!url.pathname.startsWith(BASE)) {
    response.writeHead(302, { Location: BASE });
    response.end();
    return;
  }

  let relative = url.pathname.slice(BASE.length);
  if (relative === '' || relative.endsWith('/')) relative += 'index.html';

  const file = path.join(ROOT, relative);
  if (!file.startsWith(ROOT)) {
    response.writeHead(403).end('forbidden');
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`dist-site served at http://127.0.0.1:${PORT}${BASE}`);
});
