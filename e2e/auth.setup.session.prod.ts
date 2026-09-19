import { test as setup, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import path from 'path'
import fs from 'fs'

const sessionFile = path.join(__dirname, '.auth/session.json')

// Production variant: reuses the E2E admin account to create session.json.
// The dev equivalent (auth.setup.ts) uses E2E_TEST_EMAIL which does not exist
// in production environments.
setup('authenticate session (prod)', async ({ page }) => {
  const email    = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD must be set in .env.production.e2e')
  }

  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(email, password)
  await loginPage.expectRedirectAfterLogin()
  await expect(page).not.toHaveURL(/\/login/)

  fs.mkdirSync(path.dirname(sessionFile), { recursive: true })
  await page.context().storageState({ path: sessionFile })
})
