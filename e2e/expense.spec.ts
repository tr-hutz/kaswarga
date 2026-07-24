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

    // Scope to drawer to avoid false matches from other page elements
    await expect(expenses.drawer()).toBeVisible({ timeout: 5000 })
    await expect(expenses.drawer().getByText(/Detail Pengeluaran/i)).toBeVisible()
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
    await page.locator('[data-testid="close-drawer"]').click()
    await expect(expenses.drawer()).not.toBeVisible({ timeout: 3000 })
  })

  // Approve/reject buttons are CHAIR-only — covered in permissions.spec.ts
})

// ---------------------------------------------------------------------------
// Treasurer: expense drawer fields
// ---------------------------------------------------------------------------

test.describe('expense drawer fields (treasurer)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

  test('"Nomor Bukti" field label is visible in expense drawer', async ({ page }) => {
    const expenses = new ExpensesPage(page)
    await expenses.goto()

    const rowCount = await expenses.tableRows().count()
    if (rowCount === 0) {
      test.skip()
      return
    }

    await expenses.clickRow(0)
    // Scope to drawer — "Nomor Bukti" also appears in the expense form modal
    await expect(expenses.drawer().getByText(/Nomor Bukti/i)).toBeVisible()
    await expenses.closeDrawer()
  })
})
