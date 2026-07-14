import { test as setup, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import path from 'path'
import fs from 'fs'

const sessionFile = path.join(__dirname, '.auth/resident.json')

setup('authenticate resident', async ({ page }) => {
  const email    = process.env.E2E_RESIDENT_EMAIL
  const password = process.env.E2E_RESIDENT_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_RESIDENT_EMAIL and E2E_RESIDENT_PASSWORD must be set in .env.test.local'
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
