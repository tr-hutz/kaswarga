/**
 * Payment confirmation flow:
 * - RESIDENT submits payment from /home
 * - ADMIN / TREASURER approves or rejects pending payments at /payments
 *
 * Approval tests require at least one pending payment in the database.
 */
import { test, expect, type Browser } from '@playwright/test'
import { PaymentsPage } from './pages/PaymentsPage'
import { waitForShell } from './utils/waitForShell'
import { refreshAdminSession } from './utils/refreshSession'
import path from 'path'

// ---------------------------------------------------------------------------
// Resident: submit payment from home page
// ---------------------------------------------------------------------------

test.describe('submit payment (resident)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/resident.json') })

  test('home page renders the payment form', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/home/)
    await waitForShell(page, /\/home/)

    // Payment form title (h2 heading — button also uses this text, so target heading only)
    await expect(page.getByRole('heading', { name: /Ajukan Pembayaran/i })).toBeVisible()
  })

  test('month buttons are clickable', async ({ page }) => {
    await page.goto('/home')
    await waitForShell(page, /\/home/)

    // At least one non-disabled month button should be visible
    const monthButtons = page.locator('button[type="button"]').filter({
      hasNot: page.locator('[disabled]'),
    })
    const count = await monthButtons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('submit button is disabled when no months selected', async ({ page }) => {
    await page.goto('/home')
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('submit button enables after selecting a payable month', async ({ page }) => {
    await page.goto('/home')

    // Click first non-disabled month button (not already paid/pending)
    const availableMonth = page.locator('button[type="button"]').filter({
      hasText: /Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des/i,
    }).filter({ hasNot: page.locator('.bg-slate-100') }).first()

    const count = await availableMonth.count()
    if (count === 0) {
      test.skip() // All months already paid or pending
      return
    }

    await availableMonth.click()
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Admin/Treasurer: view payments list
// ---------------------------------------------------------------------------

test.describe('payments list (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/session.json') })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    await refreshAdminSession(browser)
  })

  test('renders the payments page', async ({ page }) => {
    const payments = new PaymentsPage(page)
    await payments.goto()

    await expect(page.getByText(/Pembayaran/i).first()).toBeVisible()
  })

  test('payments table is present', async ({ page }) => {
    const payments = new PaymentsPage(page)
    await payments.goto()

    await expect(payments.table()).toBeVisible()
  })

  test('clicking a table row opens the detail drawer', async ({ page }) => {
    const payments = new PaymentsPage(page)
    await payments.goto()

    const rowCount = await payments.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await payments.clickRowByIndex(0)
    await expect(payments.drawer()).toBeVisible()
  })

  test('drawer can be closed with the ✕ button', async ({ page }) => {
    const payments = new PaymentsPage(page)
    await payments.goto()

    const rowCount = await payments.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await payments.clickRowByIndex(0)
    await payments.closeDrawer()
    await expect(payments.drawer()).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Treasurer: approve pending payment
// ---------------------------------------------------------------------------

test.describe('approve payment (treasurer)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

  test('approve first pending payment (if data exists)', async ({ page }) => {
    const payments = new PaymentsPage(page)
    await payments.goto()

    // Filter to pending if toolbar has a status filter
    const filterSelect = page.locator('select').first()
    if (await filterSelect.count()) {
      await filterSelect.selectOption('pending')
      await page.waitForLoadState('networkidle')
    }

    const rowCount = await payments.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await payments.clickFirstPendingRow()
    const approveBtn = payments.approveButton()

    // Only pending payments show the approve button
    const hasApprove = await approveBtn.count()
    if (hasApprove === 0) {
      await payments.closeDrawer()
      test.skip()
      return
    }

    await payments.approvePayment()
    // Drawer should close or show approved state
    await expect(page).toHaveURL(/\/payments/)
  })

  test('reject pending payment with reason (if data exists)', async ({ page }) => {
    const payments = new PaymentsPage(page)
    await payments.goto()

    const filterSelect = page.locator('select').first()
    if (await filterSelect.count()) {
      await filterSelect.selectOption('pending')
      await page.waitForLoadState('networkidle')
    }

    const rowCount = await payments.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await payments.clickFirstPendingRow()
    const rejectBtn = payments.rejectButton()

    const hasReject = await rejectBtn.count()
    if (hasReject === 0) {
      await payments.closeDrawer()
      test.skip()
      return
    }

    // payments rejection opens a reason modal — handled by rejectPayment
    await rejectBtn.click()
    // Check if a rejection form / confirm button appears
    const confirmReject = page.getByRole('button', { name: /Tolak/i }).last()
    await confirmReject.click()

    await expect(page).toHaveURL(/\/payments/)
  })
})
