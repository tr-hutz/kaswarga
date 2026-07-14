import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import path from 'path'

// ---------------------------------------------------------------------------
// Unauthenticated: login form behaviour
// ---------------------------------------------------------------------------

test.describe('login form', () => {
  test('renders login page', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('wrong@example.com', 'wrongpassword')
    await loginPage.expectError()
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error for empty password', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('someone@example.com', '')
    // HTML5 validation or server error — still on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('register link navigates to /register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /Daftar/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })
})

// ---------------------------------------------------------------------------
// Authenticated: valid login + logout
// ---------------------------------------------------------------------------

test.describe('authenticated session', () => {
  test.use({ storageState: path.join(__dirname, '.auth/session.json') })

  test('authenticated user can reach protected page', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('logout redirects to login', async ({ page }) => {
    // Navigate to any protected page first
    await page.goto('/')
    await page.waitForURL(url => !url.pathname.includes('/login'))

    // Click the icon-only logout button in the Topbar
    await page.locator('[data-testid="btn-logout"]').click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
