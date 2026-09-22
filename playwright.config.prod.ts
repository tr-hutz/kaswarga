/**
 * playwright.config.prod.ts
 *
 * Playwright configuration for running E2E tests against the production
 * environment using the dedicated test RT.
 *
 * Usage:
 *   npm run test:e2e:prod          # run full suite
 *   npm run test:e2e:prod:report   # open last report
 *
 * Prerequisites:
 *   1. Copy .env.production.e2e → .env.e2e and fill in production credentials.
 *   2. Run  npm run seed:e2e:prod:setup  once to create the test RT and users.
 *
 * Skipped tests:
 *   - rt-registration.spec  (creates new RTs; not safe in production)
 */

import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

// Load shared production vars first, then E2E-specific vars on top.
// Neither file overrides env vars already set (e.g. GitHub Actions secrets).
dotenvConfig({ path: '.env.production' })
dotenvConfig({ path: '.env.production.e2e' })

export default defineConfig({
  globalSetup: './e2e/global-setup.prod.ts',
  testDir:     './e2e',

  fullyParallel: false,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 2 : 1,
  workers:       1,

  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report-prod' }],
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  timeout: 90000,
  expect:  { timeout: 15000 },

  use: {
    baseURL:           process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-app.com',
    trace:             'on-first-retry',
    screenshot:        'only-on-failure',
    actionTimeout:     15000,
    navigationTimeout: 30000,
    video:             'retain-on-failure',
  },

  projects: [
    { name: 'setup',           testMatch: /auth\.setup\.session\.prod\.ts$/, retries: 0 },
    { name: 'setup:admin',     testMatch: /auth\.setup\.admin\.ts$/,     retries: 0 },
    { name: 'setup:chair',     testMatch: /auth\.setup\.chair\.ts$/,     retries: 0 },
    { name: 'setup:treasurer', testMatch: /auth\.setup\.treasurer\.ts$/, retries: 0 },
    { name: 'setup:resident',  testMatch: /auth\.setup\.resident\.ts$/,  retries: 0 },
    {
      name: 'e2e',
      dependencies: ['setup', 'setup:admin', 'setup:chair', 'setup:treasurer', 'setup:resident'],
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        /auth\.setup\./,
        /rt-registration\.spec/,    // creates new RTs — destructive
        /data-table\.spec/,         // tests a /test/data-table fixture page that doesn't exist in prod
        /donation\.spec/,           // maker-checker state not managed by global-setup; records accumulate
        /resident-management\.spec/, // creates real residents with no cleanup path
      ],
    },
  ],
})
