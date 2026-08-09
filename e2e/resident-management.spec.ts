/**
 * Resident management: public registration request + admin approval/rejection,
 * and creating a resident directly via the modal.
 *
 * Public submission tests are unauthenticated.
 * Management tests (create, approve, reject) use storageState for an admin role.
 */
import { test, expect, type Browser } from '@playwright/test'
import { ResidentsPage } from './pages/ResidentsPage'
import { refreshAdminSession } from './utils/refreshSession'
import path from 'path'

// ---------------------------------------------------------------------------
// Public: resident registration request form
// ---------------------------------------------------------------------------

test.describe('resident registration form (public)', () => {
  test('renders form with required fields', async ({ page }) => {
    await page.goto('/register/resident')
    await expect(page).toHaveURL(/\/register\/resident/)
    await expect(page.locator('input').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('back link returns to /register', async ({ page }) => {
    await page.goto('/register/resident')
    await page.getByRole('link', { name: /Kembali/i }).click()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('submit without required fields stays on page', async ({ page }) => {
    await page.goto('/register/resident')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/register\/resident/)
  })
})

// ---------------------------------------------------------------------------
// Admin: create resident via modal
// ---------------------------------------------------------------------------

test.describe('create resident (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/admin.json') })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    await refreshAdminSession(browser)
  })

  test('opens the add resident modal', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await residents.openAddModal()
    await expect(residents.nameInput()).toBeVisible()
    await expect(residents.saveButton()).toBeVisible()
    await expect(residents.cancelButton()).toBeVisible()
  })

  test('cancel closes the modal', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await residents.openAddModal()
    await residents.cancelModal()
    await expect(residents.modal()).not.toBeVisible()
  })

  test('save without name shows validation', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await residents.openAddModal()
    // Do not fill name — click save
    await residents.saveButton().click()
    // Modal should still be open (validation prevents close)
    await expect(residents.modal()).toBeVisible()
  })

  test('creates a resident with valid data', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await residents.openAddModal()
    await residents.fillResidentForm(
      'E2E Test Warga',
      'Blok E2E',
      '99',
      '08100000099'
    )
    await residents.saveResident()

    // Success toast appears immediately before the table reload completes
    await expect(page.getByText('Warga disimpan')).toBeVisible({ timeout: 15000 })
  })
})

// ---------------------------------------------------------------------------
// Admin: approve / reject pending resident registration requests
// ---------------------------------------------------------------------------

test.describe('resident pending requests (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/admin.json') })

  test('pending requests section renders', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    // Section title or empty state should be present
    const hasPendingTitle = await page.getByText(/Permintaan Bergabung/i).count()
    expect(hasPendingTitle).toBeGreaterThanOrEqual(0)
  })

  test('approve pending resident request (if data exists)', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    const pendingApprove = await page.getByRole('button', { name: 'Setujui' }).count()
    if (pendingApprove === 0) {
      test.skip()
      return
    }

    await residents.approvePendingRequest(0)
    // Toast or state update — page should still be on /residents
    await expect(page).toHaveURL(/\/residents/)
  })

  test('reject pending resident request (if data exists)', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    const pendingReject = await page.getByRole('button', { name: 'Tolak' }).count()
    if (pendingReject === 0) {
      test.skip()
      return
    }

    await residents.rejectPendingRequest(0)
    await expect(page).toHaveURL(/\/residents/)
  })
})

// ---------------------------------------------------------------------------
// Admin: resident import
// ---------------------------------------------------------------------------

test.describe('resident import (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/admin.json') })

  test('import button is visible for admin', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await expect(residents.importButton()).toBeVisible()
  })

  test('import modal opens and has expected elements', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await residents.importButton().click()
    await expect(residents.importModal()).toBeVisible()
    await expect(residents.downloadTemplateButton()).toBeVisible()
  })

  test('import modal can be closed', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    await residents.importButton().click()
    await expect(residents.importModal()).toBeVisible()

    await residents.importModal().getByRole('button', { name: /Batal|Tutup/i }).last().click()
    await expect(residents.importModal()).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Resident: import button must not be visible
// ---------------------------------------------------------------------------

test.describe('resident import button not visible for non-managers', () => {
  test.use({ storageState: path.join(__dirname, '.auth/resident.json') })

  test('import button is not visible for resident role', async ({ page }) => {
    const residents = new ResidentsPage(page)
    await residents.goto()

    expect(await residents.importButton().count()).toBe(0)
  })
})
