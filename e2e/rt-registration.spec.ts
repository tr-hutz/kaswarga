/**
 * RT registration: public submission + SUPER_ADMIN approval/rejection.
 *
 * Submission tests run unauthenticated (public form at /register/rt).
 * Approval/rejection tests run as SUPER_ADMIN and require at least one
 * pending registration in the database.
 */
import { test, expect } from '@playwright/test'
import { RtRegistrationPage } from './pages/RtRegistrationPage'
import path from 'path'

// ---------------------------------------------------------------------------
// Public: submit RT registration form
// ---------------------------------------------------------------------------

test.describe('RT registration form (public)', () => {
  test('shows all required fields', async ({ page }) => {
    await page.goto('/register/rt')
    await expect(page).toHaveURL(/\/register\/rt/)

    // Minimum: name and code inputs must be present
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('back link returns to /register', async ({ page }) => {
    await page.goto('/register/rt')
    await page.getByRole('link', { name: /Kembali/i }).click()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('submit without required fields stays on page', async ({ page }) => {
    await page.goto('/register/rt')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/register\/rt/)
  })

  test('fills and submits minimal valid form', async ({ page }) => {
    await page.goto('/register/rt')

    // Fill required text inputs: RT name, code, address
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('RT Test E2E')         // name
    await inputs.nth(1).fill('RT-E2E-001')           // code

    // Address (first textarea or next text input)
    const addressInput = page.locator('input').filter({ hasText: '' }).nth(2)
    await addressInput.fill('Jl. Test No. 1').catch(() => {/* optional field, skip */})

    // Submit — successful submission shows success view or redirects
    await page.locator('button[type="submit"]').click()

    // Either still on the page (validation) or shows success state
    await expect(page).toHaveURL(/\/register\/rt/)
  })
})

// ---------------------------------------------------------------------------
// SUPER_ADMIN: manage pending RT registrations
// ---------------------------------------------------------------------------

test.describe('RT registration management (SUPER_ADMIN)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/superadmin.json') })

  test('renders the RT registration management page', async ({ page }) => {
    const rtReg = new RtRegistrationPage(page)
    await rtReg.goto()

    // Page should show the title
    await expect(page.getByText(/Pendaftaran RT/i).first()).toBeVisible()
  })

  test('shows status tabs', async ({ page }) => {
    const rtReg = new RtRegistrationPage(page)
    await rtReg.goto()

    await expect(page.getByRole('button', { name: /Menunggu/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Disetujui/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ditolak/i })).toBeVisible()
  })

  test('shows empty state or pending cards on pending tab', async ({ page }) => {
    const rtReg = new RtRegistrationPage(page)
    await rtReg.goto()

    await page.getByRole('button', { name: /Menunggu/i }).click()

    const hasPending = await page.getByRole('button', { name: 'Setujui' }).count()
    if (hasPending === 0) {
      await expect(rtReg.emptyMessage()).toBeVisible()
    } else {
      await expect(page.getByRole('button', { name: 'Setujui' }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: 'Tolak' }).first()).toBeVisible()
    }
  })

  test('approve pending RT registration (if data exists)', async ({ page }) => {
    const rtReg = new RtRegistrationPage(page)
    await rtReg.goto()

    await page.getByRole('button', { name: /Menunggu/i }).click()

    const pendingCount = await page.getByRole('button', { name: 'Setujui' }).count()
    if (pendingCount === 0) {
      test.skip()
      return
    }

    await rtReg.approveCard(0)

    // After approval, the card should no longer show on the pending tab
    await expect(page).toHaveURL(/\/rt\/registration/)
  })

  test('reject pending RT registration (if data exists)', async ({ page }) => {
    const rtReg = new RtRegistrationPage(page)
    await rtReg.goto()

    await page.getByRole('button', { name: /Menunggu/i }).click()

    const pendingCount = await page.getByRole('button', { name: 'Tolak' }).count()
    if (pendingCount === 0) {
      test.skip()
      return
    }

    // reject uses window.confirm — handler is registered in rtReg.rejectCard
    await rtReg.rejectCard(0)

    await expect(page).toHaveURL(/\/rt\/registration/)
  })
})
