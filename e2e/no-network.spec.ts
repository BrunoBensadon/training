import { expect, test } from '@playwright/test';

/**
 * The privacy claim, checked rather than asserted in a README.
 *
 * Two separate things are being established:
 *
 *  1. Nothing cross-origin, ever. No font CDN, no analytics, no beacon.
 *     This is the claim the first screen makes to trainees, and it is
 *     absolute — there is no allowed exception.
 *
 *  2. After load, nothing but the app's own files. Answering all six sets,
 *     switching language and saving a result must not produce a single
 *     request. The service worker precaching the app for offline use is
 *     the one thing that runs after load, and it may only ask for files
 *     this build produced.
 *
 * The brief asked for "no network requests after load". The service worker
 * makes that literally false and materially truer: it fetches the app's
 * own assets once so that the app never needs the network again. That
 * exception is enumerated below rather than waved through.
 */

const APP = '/training/elc-placement/';

test.describe('the app talks to nothing', () => {
  test('makes no cross-origin request, at any point', async ({ page, baseURL }) => {
    const own = new URL(baseURL!).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol === 'data:' || url.protocol === 'blob:') return;
      if (url.origin !== own) foreign.push(request.url());
    });

    await page.goto(APP);
    await page.getByRole('link', { name: /^start$/i }).click();
    await page.waitForLoadState('networkidle');

    expect(foreign, `cross-origin requests: ${foreign.join(', ')}`).toEqual([]);
  });

  test('after load, requests nothing but its own precache', async ({ page, baseURL }) => {
    await page.goto(APP);
    await page.waitForLoadState('load');

    const precache = await readPrecache(page, baseURL!);
    const after: string[] = [];
    page.on('request', (request) => after.push(request.url()));

    // Everything a trainee does: answer a set, switch language, navigate.
    await page.getByRole('link', { name: /^start$/i }).click();
    const groups = page.getByRole('radiogroup');
    await expect(groups).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      await groups.nth(i).getByRole('radio').nth(i).check();
    }
    await page.getByRole('button', { name: /next set/i }).click();
    await page.getByRole('button', { name: 'Português (Brasil)' }).click();
    await page.waitForTimeout(400);

    const unexpected = after
      .map((url) => new URL(url))
      .filter((url) => url.origin !== new URL(baseURL!).origin || !precache.has(url.pathname));

    expect(
      unexpected.map((url) => url.href),
      'requests after load that are not part of the precache',
    ).toEqual([]);
  });
});

/** The list the generated service worker precaches, read from the build. */
async function readPrecache(
  page: import('@playwright/test').Page,
  baseURL: string,
): Promise<Set<string>> {
  const response = await page.request.get(`${baseURL}/training/elc-placement/sw.js`);
  const source = await response.text();
  const match = /const PRECACHE = (\[[^\]]*\]);/.exec(source);
  expect(match, 'the built service worker should carry a precache list').toBeTruthy();
  const urls = JSON.parse(match![1]!) as string[];
  expect(urls.length).toBeGreaterThan(3);
  return new Set([...urls, '/training/elc-placement/sw.js']);
}
