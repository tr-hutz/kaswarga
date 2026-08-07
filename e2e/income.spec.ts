/**
 * Income management flow:
 * - TREASURER creates an income entry via the form modal
 * - ADMIN views the income page and drawer
 *
 * Approval tests require at least one pending income in the database.
 */
import { test, expect, type Browser } from '@playwright/test'
import { IncomePage } from './pages/IncomePage'
import { refreshAdminSession } from './utils/refreshSession'
import path from 'path'

// ---------------------------------------------------------------------------
// Treasurer: create income
// ---------------------------------------------------------------------------

test.describe('create income (treasurer)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

    test('renders the income page', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await expect(page.getByText(/Pemasukan/i).first()).toBeVisible()
    })

    test('"Tambah" button is visible for treasurer', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await expect(income.addButton()).toBeVisible()
    })

    test('opens the create income form modal', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await income.openCreateForm()
        await expect(income.amountInput()).toBeVisible()
        await expect(income.dateInput()).toBeVisible()
        await expect(income.saveButton()).toBeVisible()
        await expect(income.cancelButton()).toBeVisible()
    })

    test('cancel closes the modal', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await income.openCreateForm()
        await income.cancelForm()
        await expect(income.modal()).not.toBeVisible()
    })

    test('save without required fields stays in modal', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await income.openCreateForm()
        await income.saveButton().click()
        await expect(income.modal()).toBeVisible()
    })

    test('creates an income with valid data', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await income.openCreateForm()
        await income.fillIncomeForm({
            name:   'E2E Pemasukan Test',
            amount: 100000,
            date:   '2026-07-15',
        })
        await income.saveIncome()

        await expect(income.modal()).not.toBeVisible({ timeout: 30000 })
        await expect(page.getByText('E2E Pemasukan Test').first()).toBeVisible({ timeout: 30000 })
    })
})

// ---------------------------------------------------------------------------
// RT Chair: view income, approve-all visible, no add/edit/delete
// ---------------------------------------------------------------------------

test.describe('income for RT chair', () => {
    test.use({ storageState: path.join(__dirname, '.auth/chair.json') })

    test('renders the income page', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()
        await expect(page.getByText(/Pemasukan/i).first()).toBeVisible()
    })

    test('"Tambah" button is NOT visible for chair', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()
        await expect(income.addButton()).not.toBeVisible()
    })

    test('edit and delete buttons are NOT visible for chair on pending rows', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        const rowCount = await income.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        await expect(page.getByRole('button', { name: /^Edit$/i }).first()).not.toBeVisible()
        await expect(page.getByRole('button', { name: /^Hapus$/i }).first()).not.toBeVisible()
    })
})

// ---------------------------------------------------------------------------
// Resident: cannot access income module
// ---------------------------------------------------------------------------

test.describe('income access denied for resident', () => {
    test.use({ storageState: path.join(__dirname, '.auth/resident.json') })

    test('income navigation item is not visible for resident', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('link', { name: /^Pemasukan$/i })).not.toBeVisible()
    })

    test('navigating directly to /income shows 403 error', async ({ page }) => {
        await page.goto('/income')
        await expect(page.getByText('403')).toBeVisible({ timeout: 10000 })
    })
})

// ---------------------------------------------------------------------------
// Admin: view income page and drawer
// ---------------------------------------------------------------------------

test.describe('income drawer (admin)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/admin.json') })

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
        await refreshAdminSession(browser)
    })

    test('renders the income page', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        await expect(page.getByText(/Pemasukan/i).first()).toBeVisible()
    })

    test('clicking a table row opens the drawer', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        const rowCount = await income.tableRows().count()
        if (rowCount === 0) {
            test.skip()
            return
        }

        await income.clickRow(0)
        await expect(income.drawer()).toBeVisible({ timeout: 10000 })
    })

    test('closing the drawer with ✕ hides it', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        const rowCount = await income.tableRows().count()
        if (rowCount === 0) {
            test.skip()
            return
        }

        await income.clickRow(0)
        await income.closeDrawer()
        await expect(income.drawer()).not.toBeVisible({ timeout: 3000 })
    })
})
