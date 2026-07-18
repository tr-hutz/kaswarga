/**
 * Expense management flow:
 * - TREASURER creates an expense via the form modal
 * - CHAIR / ADMIN approves or rejects pending expenses via the drawer
 *
 * Approval tests require at least one pending expense in the database.
 */
import { test, expect, type Browser } from '@playwright/test'
import { ExpensesPage } from './pages/ExpensesPage'
import { refreshAdminSession } from './utils/refreshSession'
import path from 'path'

// ---------------------------------------------------------------------------
// Treasurer: create expense
// ---------------------------------------------------------------------------

test.describe('create expense (treasurer)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

  test('renders the expenses page', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expect(page.getByText(/Pengeluaran/i).first()).toBeVisible()
  })

  test('"Tambah" button is visible for treasurer', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expect(expenses.addButton()).toBeVisible()
  })

  test('opens the create expense form modal', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expenses.openCreateForm()
    await expect(expenses.dateInput()).toBeVisible()
    await expect(expenses.amountInput()).toBeVisible()
    await expect(expenses.saveButton()).toBeVisible()
    await expect(expenses.cancelButton()).toBeVisible()
  })

  test('cancel closes the modal', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expenses.openCreateForm()
    await expenses.cancelForm()
    await expect(expenses.modal()).not.toBeVisible()
  })

  test('save without required fields stays in modal', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expenses.openCreateForm()
    // Do not fill anything — click save
    await expenses.saveButton().click()
    await expect(expenses.modal()).toBeVisible()
  })

  test('creates an expense with valid data', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expenses.openCreateForm()

    // Pick a category before filling the rest
    const categorySelect = expenses.categorySelect()
    const categoryCount  = await categorySelect.locator('option').count()
    if (categoryCount > 1) {
      await categorySelect.selectOption({ index: 1 })
    }

    await expenses.fillExpenseForm({
      date:        '2026-07-01',
      amount:      50000,
      recipient:   'E2E Vendor',
      description: 'Test pengeluaran e2e',
    })

    await expenses.saveExpense()

    // Modal should close
    await expect(expenses.modal()).not.toBeVisible({ timeout: 30000 })
    // Newly created expense should appear in table
    await expect(page.getByText('E2E Vendor').first()).toBeVisible({ timeout: 30000 })
  })
})

// ---------------------------------------------------------------------------
// Admin/Chair: view expense drawer
// ---------------------------------------------------------------------------

test.describe('expense drawer (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/session.json') })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    await refreshAdminSession(browser)
  })

  test('renders the expenses page', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    await expect(page.getByText(/Pengeluaran/i).first()).toBeVisible()
  })

  test('clicking a table row opens the drawer', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    const rowCount = await expenses.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await expenses.clickRow(0)

    // Drawer shows "Detail Pengeluaran"
    await expect(page.getByText(/Detail Pengeluaran/i)).toBeVisible({ timeout: 5000 })
  })

  test('closing the drawer with ✕ hides it', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    const rowCount = await expenses.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await expenses.clickRow(0)
    await page.getByText('✕').last().click()
    await expect(page.getByText(/Detail Pengeluaran/i)).not.toBeVisible({ timeout: 3000 })
  })
})

// ---------------------------------------------------------------------------
// Admin/Chair: approve pending expense
// ---------------------------------------------------------------------------

test.describe('approve / reject expense (admin)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/session.json') })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    await refreshAdminSession(browser)
  })

  test('approve first pending expense (if data exists)', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    const rowCount = await expenses.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    // Open each row until we find one with the approve button
    let approved = false
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      await expenses.clickRow(i)
      const approveBtn = page.getByRole('button', { name: 'Setujui' })
      if (await approveBtn.count() > 0) {
        await approveBtn.click()
        approved = true
        break
      }
      await page.getByText('✕').last().click()
    }

    if (!approved) {
      test.skip()
      return
    }

    await expect(page).toHaveURL(/\/expenses/)
  })

  test('reject pending expense with reason (if data exists)', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    const rowCount = await expenses.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    let rejected = false
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      await expenses.clickRow(i)
      const rejectBtn = page.getByRole('button', { name: 'Tolak' })
      if (await rejectBtn.count() > 0) {
        await rejectBtn.click()

        // Reject mode: textarea + "Konfirmasi Tolak" button
        const textarea = page.locator('textarea').last()
        if (await textarea.isVisible()) {
          await textarea.fill('Alasan penolakan dari e2e test')
        }

        const confirmBtn = page.getByRole('button', { name: 'Konfirmasi Tolak' })
        await confirmBtn.click()
        rejected = true
        break
      }
      await page.getByText('✕').last().click()
    }

    if (!rejected) {
      test.skip()
      return
    }

    await expect(page).toHaveURL(/\/expenses/)
  })
})
