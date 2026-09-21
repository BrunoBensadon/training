import { expect, test, type Page } from '@playwright/test';

const APP = '/training/elc-placement/';
const SETS = 6;

/** Ranks the four statements of the current set, 1..4 top to bottom. */
async function rankCurrentSet(page: Page): Promise<void> {
  const groups = page.getByRole('radiogroup');
  await expect(groups).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await groups.nth(index).getByRole('radio').nth(index).check();
  }
}

async function completeAllSets(page: Page): Promise<void> {
  await page.getByRole('link', { name: /^start$/i }).click();
  for (let set = 1; set <= SETS; set += 1) {
    await expect(page.getByText(`Set ${set} of ${SETS}`)).toBeVisible();
    await rankCurrentSet(page);
    await page
      .getByRole('button', { name: set === SETS ? /see your result/i : /next set/i })
      .click();
  }
}

test.describe('the whole thing works', () => {
  test('six sets produce a result that adds up', async ({ page }) => {
    await page.goto(APP);
    await completeAllSets(page);

    await expect(page).toHaveURL(/#\/result\?r=e1%3A1\.0\.0%3A|#\/result\?r=e1:1\.0\.0:/);
    await expect(page.getByRole('heading', { name: /where you leaned today/i })).toBeVisible();

    // The mandated copy, on the result screen, not buried.
    await expect(page.getByText(/this is a preference, not a diagnosis/i)).toBeVisible();

    // The whole shape, not a single label.
    const scores = await page.locator('table.shape tbody td.num').allTextContents();
    expect(scores).toHaveLength(4);
    expect(scores.reduce((sum, value) => sum + Number(value), 0)).toBe(60);

    // The diagram is an image with a name, and its numbers are repeated in text.
    await expect(page.getByRole('img', { name: /learning cycle/i })).toBeVisible();
    await expect(page.getByRole('list').filter({ hasText: /perceiving/i })).toBeVisible();
  });

  test('a saved link reproduces the same result', async ({ page }) => {
    await page.goto(APP);
    await completeAllSets(page);

    const saved = page.url();
    const before = await page.locator('table.shape tbody td.num').allTextContents();

    await page.goto(saved);
    await expect(page.getByRole('heading', { name: /where you leaned today/i })).toBeVisible();
    expect(await page.locator('table.shape tbody td.num').allTextContents()).toEqual(before);

    // The result is in the fragment, which is never sent to a server.
    expect(new URL(saved).search).toBe('');
    expect(new URL(saved).hash).toContain('r=e1');
  });

  test('a damaged link says so instead of showing a wrong result', async ({ page }) => {
    await page.goto(`${APP}#/result?r=e1:1.0.0:zzzzzz`);
    await expect(page.getByRole('heading', { name: /could not be read/i })).toBeVisible();
    await page.getByRole('button', { name: /answer the six sets/i }).click();
    await expect(page.getByRole('heading', { name: /where do you lean/i })).toBeVisible();
  });

  test('language comes from the link, and the toggle keeps you where you are', async ({ page }) => {
    await page.goto(`${APP}#/about?lang=pt-BR`);
    await expect(page.getByRole('heading', { name: /sobre este instrumento/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: /about this instrument/i })).toBeVisible();
    expect(page.url()).toContain('lang=en');
    expect(page.url()).toContain('/about');
  });

  test('the about page states plainly that it is not validated', async ({ page }) => {
    await page.goto(`${APP}#/about`);
    await expect(page.getByText(/no psychometric validation of any kind/i)).toBeVisible();
    await expect(page.getByText(/Pashler/)).toBeVisible();
    await expect(page.getByText(/Coffield/)).toBeVisible();
    await expect(page.getByText(/α ≥ \.70/)).toBeVisible();
  });

  test('the facilitator card carries the prompts and the lopsided guidance', async ({ page }) => {
    await page.goto(`${APP}#/facilitator`);
    await expect(page.getByRole('heading', { name: /floor exercise/i })).toBeVisible();
    await expect(page.locator('ol.prompts li')).toHaveCount(3);
    await expect(page.getByText(/never leave one person standing alone/i)).toBeVisible();
    await expect(page.getByText(/eleven reflectors and one activist/i)).toBeVisible();
  });
});

test.describe('ranking is operable and announced', () => {
  test('can be ranked with the keyboard alone', async ({ page }) => {
    await page.goto(`${APP}#/q/1`);

    // Tab in from the top of the document until a rank control has focus.
    let guard = 0;
    while (guard < 25) {
      await page.keyboard.press('Tab');
      const role = await page.evaluate(() => document.activeElement?.getAttribute('type'));
      if (role === 'radio') break;
      guard += 1;
    }
    expect(guard, 'a rank control should be reachable by tabbing').toBeLessThan(25);

    const firstGroup = page.getByRole('radiogroup').first();
    await page.keyboard.press('Space');
    await expect(firstGroup.getByRole('radio').first()).toBeChecked();

    // Arrow keys move within the statement's own ranks.
    await page.keyboard.press('ArrowRight');
    await expect(firstGroup.getByRole('radio').nth(1)).toBeChecked();
    await expect(firstGroup.getByRole('radio').first()).not.toBeChecked();
  });

  test('taking a rank from another statement is announced, not silent', async ({ page }) => {
    await page.goto(`${APP}#/q/1`);
    const groups = page.getByRole('radiogroup');
    const live = page.locator('[role="status"]');

    await groups.nth(0).getByRole('radio').nth(0).check();
    await expect(live).toContainText(/rank 1 given to/i);

    // The same rank, now taken by a different statement.
    await groups.nth(1).getByRole('radio').nth(0).check();
    await expect(live).toContainText(/no longer ranked/i);
    await expect(groups.nth(0).getByRole('radio').nth(0)).not.toBeChecked();

    // And a genuine swap, where both statements end up ranked.
    await groups.nth(0).getByRole('radio').nth(1).check();
    await groups.nth(1).getByRole('radio').nth(1).check();
    await expect(live).toContainText(/moved to rank/i);
  });

  test('refuses to advance on a half-finished set, and says why', async ({ page }) => {
    await page.goto(`${APP}#/q/1`);
    await page.getByRole('radiogroup').first().getByRole('radio').first().check();
    await page.getByRole('button', { name: /next set/i }).click();

    await expect(page.getByRole('alert')).toContainText(/rank all four/i);
    await expect(page).toHaveURL(/#\/q\/1/);
  });

  test('every rank control clears the 44px touch target', async ({ page }) => {
    await page.goto(`${APP}#/q/1`);
    const options = page.locator('.rank-option');
    const count = await options.count();
    expect(count).toBe(16);
    for (let index = 0; index < count; index += 1) {
      const box = await options.nth(index).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('phone width', () => {
  // Most trainees are on phones. A page that scrolls sideways is a page
  // where a control ends up off the edge of the screen, which is how the
  // language toggle became unreachable once already.
  const routes = ['#/', '#/q/1', '#/about', '#/facilitator'];

  for (const route of routes) {
    test(`${route} does not scroll sideways`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(`${APP}${route}`);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, `${route} overflows by ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(
        clientWidth,
      );
    });
  }

  test('the result screen fits too', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(APP);
    await completeAllSets(page);
    const [scrollWidth, clientWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test('moving to the next set cannot change the set you just left', async ({ page }) => {
  // Navigation used to render a tick late, so a fast tap after "Next set"
  // landed on the previous set's controls and quietly altered an answer.
  await page.goto(`${APP}#/q/1`);
  await rankCurrentSet(page);
  await expect(page.getByText(/set complete/i)).toBeVisible();

  await page.getByRole('button', { name: /next set/i }).click();
  await page.getByRole('radiogroup').first().getByRole('radio').first().check();

  await page.getByRole('button', { name: /^back$/i }).click();
  await expect(page.getByText(`Set 1 of ${SETS}`)).toBeVisible();
  await expect(page.getByText(/set complete/i)).toBeVisible();
});

test('the privacy claim is checkable and the page describes itself in both languages', async ({
  page,
}) => {
  await page.goto(`${APP}#/q/1`);

  // A tool that claims it transmits nothing should link to its own source.
  const source = page.locator('.site-footer a');
  await expect(source).toHaveAttribute('href', /github\.com\/.+\/training/);

  // And should say out loud what holding answers in memory only costs.
  await expect(page.locator('.leave-warning')).toContainText(/reload/i);

  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute('content', /leaves your device/i);
  await page.getByRole('button', { name: 'Português (Brasil)' }).click();
  await expect(description).toHaveAttribute('content', /sai do seu aparelho/i);
});
