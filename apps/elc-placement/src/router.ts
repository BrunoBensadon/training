/**
 * Hash routing.
 *
 * Everything lives in the fragment — the route, the language and a saved
 * result — for two reasons. It is what lets a static site under
 * /training/elc-placement/ have several screens without server rewrites,
 * and a fragment is never sent to a server, which is the only way to let
 * someone keep a result without anyone being able to collect it.
 *
 * Format: #/path?key=value
 */

export interface Route {
  path: string;
  params: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const queryAt = raw.indexOf('?');
  const path = (queryAt === -1 ? raw : raw.slice(0, queryAt)) || '/';
  const params = new URLSearchParams(queryAt === -1 ? '' : raw.slice(queryAt + 1));
  return { path: path.startsWith('/') ? path : `/${path}`, params };
}

export function buildHash(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export const ROUTES = {
  intro: '/',
  set: (n: number) => `/q/${n}`,
  result: '/result',
  about: '/about',
  facilitator: '/facilitator',
} as const;

/** Reads the 1-based set number out of /q/3, or null. */
export function setNumberFrom(path: string): number | null {
  const match = /^\/q\/(\d+)$/.exec(path);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isInteger(n) && n >= 1 ? n : null;
}
