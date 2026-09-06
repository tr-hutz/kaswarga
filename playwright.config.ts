import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.test.local' })

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'setup',            testMatch: /auth\.setup\.ts$/,            retries: 0 },
    { name: 'setup:superadmin', testMatch: /auth\.setup\.superadmin\.ts$/, retries: 0 },
    { name: 'setup:admin',      testMatch: /auth\.setup\.admin\.ts$/,      retries: 0 },
    { name: 'setup:chair',      testMatch: /auth\.setup\.chair\.ts$/,      retries: 0 },
    { name: 'setup:treasurer',  testMatch: /auth\.setup\.treasurer\.ts$/,  retries: 0 },
    { name: 'setup:resident',   testMatch: /auth\.setup\.resident\.ts$/,   retries: 0 },
    {
      name: 'e2e',
      dependencies: ['setup', 'setup:superadmin', 'setup:admin', 'setup:chair', 'setup:treasurer', 'setup:resident'],
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /auth\.setup\./,
    },
  ],
})
