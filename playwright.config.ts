import { defineConfig, devices } from '@playwright/test';

/**
 * One browser, on purpose.
 *
 * These are static pages with no framework and no platform APIs beyond
 * service workers; a cross-browser grid would cost minutes per run and
 * catch nothing this project is likely to get wrong. What the browser
 * checks are actually for is the pair of claims that cannot be made from
 * unit tests: that the app works end to end with a keyboard, and that it
 * talks to nothing.
 */
const PORT = 4178;

/**
 * Some environments ship a Chromium that does not match the build this
 * version of Playwright downloads. PLAYWRIGHT_CHROMIUM_PATH points at it.
 * Unset — which is the case in CI, where `playwright install` runs — the
 * browser Playwright manages is used.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const launch = executablePath ? { launchOptions: { executablePath } } : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...launch } },
    // Most trainees are on phones, so the flow is checked on one too.
    { name: 'mobile', use: { ...devices['Pixel 7'], ...launch } },
  ],
  webServer: {
    command: 'node scripts/serve-site.mjs',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
