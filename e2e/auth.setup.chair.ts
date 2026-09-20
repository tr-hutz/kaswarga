import { test as setup, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import path from 'path'
import fs from 'fs'

const sessionFile = path.join(__dirname, '.auth/chair.json')

setup('authenticate chair (ketua RT)', async ({ page }) => {
  const email    = process.env.E2E_CHAIR_EMAIL
  const password = process.env.E2E_CHAIR_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_CHAIR_EMAIL and E2E_CHAIR_PASSWORD must be set in .env.production.e2e (or .env.test.local for dev)'
    )
  }

  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(email, password)
  await loginPage.expectRedirectAfterLogin()
  await expect(page).not.toHaveURL(/\/login/)

  fs.mkdirSync(path.dirname(sessionFile), { recursive: true })
  await page.context().storageState({ path: sessionFile })
})