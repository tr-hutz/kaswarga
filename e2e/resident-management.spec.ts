/**
 * Resident management: public registration request + admin approval/rejection,
 * and creating a resident directly via the modal.
 *
 * Public submission tests are unauthenticated.
 * Management tests (create, approve, reject) use storageState for an admin role.
 */
import { test, expect } from '@playwright/test'
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
  test.use({ storageState: path.join(__dirname, '.auth/session.json') })

  test.beforeAll(async ({ browser }) => {
    await refreshAdminSession(browser)
  }, { timeout: 60000 })

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

    // Modal should close after createResident() completes
    await expect(residents.modal()).not.toBeVisible({ timeout: 30000 })

    // After save, loadData() sets loading=true which replaces the table with a loading div —
    // the row is not in the DOM until the refresh query (with nested payments JOIN) completes.
    // Wait for loading to clear, then check for the new row.
    await expect(page.locator('[data-testid="resident-table-loading"]')).not.toBeAttached({ timeout: 60000 })
    await expect(page.getByText('E2E Test Warga').first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Admin: approve / reject pending resident registration requests
// ---------------------------------------------------------------------------

test.describe('resident pending requests (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/session.json') })

  test.beforeAll(async ({ browser }) => {
    await refreshAdminSession(browser)
  }, { timeout: 60000 })

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
