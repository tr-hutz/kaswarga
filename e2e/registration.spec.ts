import { test, expect } from '@playwright/test'
import { RegisterPage } from './pages/RegisterPage'

test.describe('registration landing', () => {
  test('shows both registration options', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.gotoLanding()

    await expect(page).toHaveURL(/\/register$/)
    await reg.expectLandingOptions()
  })

  test('RT card links to /register/rt', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /RT baru/i }).click()
    await expect(page).toHaveURL(/\/register\/rt/)
  })

  test('Resident card links to /register/resident', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /Warga/i }).click()
    await expect(page).toHaveURL(/\/register\/resident/)
  })

  test('back link from landing goes to /login', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /Masuk/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('RT registration form', () => {
  test('form renders required fields', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.gotoRt()

    await expect(page).toHaveURL(/\/register\/rt/)
    // At least one text input should be visible (RT name field)
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
  })

  test('back link returns to /register', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.gotoRt()
    await reg.clickBackFromRt()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('submit without required fields shows validation', async ({ page }) => {
    await page.goto('/register/rt')
    await page.locator('button[type="submit"]').click()
    // Should stay on the same page (HTML5 validation or error state)
    await expect(page).toHaveURL(/\/register\/rt/)
  })
})

test.describe('resident registration form', () => {
  test('form renders required fields', async ({ page }) => {
    const reg = new RegisterPage(page)
    await reg.gotoResident()

    await expect(page).toHaveURL(/\/register\/resident/)
    await expect(page.locator('input').first()).toBeVisible()
  })

  test('back link returns to /register', async ({ page }) => {
    await page.goto('/register/resident')
    await page.getByRole('link', { name: /Kembali/i }).click()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('submit without required fields shows validation', async ({ page }) => {
    await page.goto('/register/resident')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/register\/resident/)
  })
})
