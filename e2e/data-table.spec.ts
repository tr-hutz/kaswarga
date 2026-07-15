/**
 * DataTable contract tests — generic fixture page
 *
 * Tests every DataTable behaviour against a hardcoded 55-row mock dataset.
 * No authentication or database required.
 *
 * Dataset characteristics
 * -----------------------
 *   55 rows total, 13 inactive (rows where i % 4 === 3), 42 active.
 *   Names are deterministic: "Item 001" … "Item 055".
 *   Groups cycle through A, B, C, D, E.
 *
 * The fixture page lives at /test/data-table and is excluded from production
 * by a notFound() guard. It accepts ?sim=loading and ?sim=error to force
 * those states without network interception.
 */

import { test, expect } from '@playwright/test'
import { DataTableFixturePage } from './pages/DataTableFixturePage'

const STORAGE_KEY = 'dt:pageSize:dt-fixture'

test.describe('DataTable — contract tests', () => {
    // Clear stored page-size preference before every test so tests are isolated.
    test.beforeEach(async ({ page }) => {
        await page.addInitScript((key) => {
            localStorage.removeItem(key)
        }, STORAGE_KEY)
    })

    // ─── Search ───────────────────────────────────────────────────────────────

    test.describe('search', () => {
        test('typing in search box updates URL and filters rows', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            const totalBefore = await dt.rowCount()
            expect(totalBefore).toBeGreaterThan(0)

            await dt.searchBox().fill('Item 01')
            await expect(page).toHaveURL(/search=Item/, { timeout: 5000 })

            // "Item 010"–"Item 019" match → 11 rows
            const totalAfter = await dt.rowCount()
            expect(totalAfter).toBeLessThan(totalBefore)
        })

        test('search returns no rows for a non-matching term → empty state shown', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.searchBox().fill('___no_match_xyz___')
            await expect(page).toHaveURL(/search=/, { timeout: 5000 })

            await expect(dt.emptyState()).toBeVisible({ timeout: 10000 })
            expect(await dt.rowCount()).toBe(0)
        })

        test('clearing search restores the full result set', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            const totalBefore = await dt.rowCount()

            await dt.searchBox().fill('Item 01')
            await expect(page).toHaveURL(/search=/, { timeout: 5000 })

            await dt.searchBox().clear()
            await expect(page).not.toHaveURL(/search=/, { timeout: 5000 })

            await dt.waitForRows()
            expect(await dt.rowCount()).toBe(totalBefore)
        })
    })

    // ─── Filter ───────────────────────────────────────────────────────────────

    test.describe('filter', () => {
        test('selecting "active" filter updates URL with f_status=active', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.statusFilter().selectOption('active')
            await expect(page).toHaveURL(/f_status=active/, { timeout: 5000 })

            await dt.waitForRows()
            const count = await dt.rowCount()
            // 41 active rows, default page size 20 → exactly 20
            expect(count).toBeLessThanOrEqual(20)
            expect(count).toBeGreaterThan(0)
        })

        test('selecting "inactive" filter shows only inactive rows', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.statusFilter().selectOption('inactive')
            await expect(page).toHaveURL(/f_status=inactive/, { timeout: 5000 })

            await dt.waitForRows()
            const count = await dt.rowCount()
            // 13 inactive rows (i % 4 === 3 for i=0..54) → all fit on one page
            expect(count).toBe(13)
        })

        test('resetting filter to "All Status" removes f_status from URL', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.statusFilter().selectOption('active')
            await expect(page).toHaveURL(/f_status=active/, { timeout: 5000 })

            await dt.statusFilter().selectOption('')
            await expect(page).not.toHaveURL(/f_status=/, { timeout: 5000 })
        })
    })

    // ─── Sort ─────────────────────────────────────────────────────────────────

    test.describe('sort', () => {
        test('clicking an inactive column sets sortBy and asc direction in URL', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            // Default sort is "name" — click "Group" (different column)
            await dt.sortButton('Group').click()

            await expect(page).toHaveURL(/sortBy=group/, { timeout: 5000 })
            await expect(page).toHaveURL(/sortDirection=asc/, { timeout: 5000 })
        })

        test('clicking the same column again toggles to desc', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.sortButton('Group').click()
            await expect(page).toHaveURL(/sortDirection=asc/, { timeout: 5000 })

            await dt.sortButton('Group').click()
            await expect(page).toHaveURL(/sortDirection=desc/, { timeout: 5000 })
        })

        test('clicking the active (default) column toggles to desc', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            // Default sort is name/asc — clicking Name toggles to desc
            await dt.sortButton('Name').click()
            await expect(page).toHaveURL(/sortBy=name/, { timeout: 5000 })
            await expect(page).toHaveURL(/sortDirection=desc/, { timeout: 5000 })
        })
    })

    // ─── Pagination ───────────────────────────────────────────────────────────

    test.describe('pagination', () => {
        test('default 20-row page shows first 20 rows with page 2 button visible', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            // 55 rows ÷ 20 per page = 3 pages
            expect(await dt.rowCount()).toBe(20)
            await expect(page.getByRole('button', { name: '2', exact: true })).toBeVisible()
        })

        test('navigating to page 2 updates URL and shows different rows', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            const firstRowPage1 = await dt.firstRowText()

            await page.getByRole('button', { name: '2', exact: true }).click()
            await expect(page).toHaveURL(/page=2/, { timeout: 5000 })

            const firstRowPage2 = await dt.firstRowText()
            expect(firstRowPage2).not.toBe(firstRowPage1)
        })

        test('prev button goes back to page 1', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await page.getByRole('button', { name: '2', exact: true }).click()
            await expect(page).toHaveURL(/page=2/, { timeout: 5000 })

            await dt.prevButton().click()
            await expect(page).toHaveURL(/page=1/, { timeout: 5000 })
        })

        test('last page shows remaining rows (55 % 20 = 15)', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await page.getByRole('button', { name: '3', exact: true }).click()
            await expect(page).toHaveURL(/page=3/, { timeout: 5000 })

            expect(await dt.rowCount()).toBe(15)
        })
    })

    // ─── Rows per page ────────────────────────────────────────────────────────

    test.describe('rows per page', () => {
        test('changing page size to 10 updates URL and limits row count', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.pageSizeSelect().selectOption('10')

            await expect(page).toHaveURL(/pageSize=10/, { timeout: 5000 })
            expect(await dt.rowCount()).toBe(10)
        })

        test('changing page size to 50 shows 50 rows', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.pageSizeSelect().selectOption('50')
            await expect(page).toHaveURL(/pageSize=50/, { timeout: 5000 })
            expect(await dt.rowCount()).toBe(50)
        })

        test('page size preference is saved to localStorage', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.pageSizeSelect().selectOption('50')
            await expect(page).toHaveURL(/pageSize=50/, { timeout: 5000 })

            const stored = await page.evaluate(
                (key) => localStorage.getItem(key),
                STORAGE_KEY,
            )
            expect(stored).toBe('50')
        })

        test('stored preference is restored on fresh navigation (no URL param)', async ({ page }) => {
            await page.addInitScript((key) => {
                localStorage.setItem(key, '10')
            }, STORAGE_KEY)

            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.waitForRows()
            expect(await dt.rowCount()).toBe(10)
            await expect(dt.pageSizeSelect()).toHaveValue('10')
        })

        test('URL pageSize overrides localStorage preference', async ({ page }) => {
            await page.addInitScript((key) => {
                localStorage.setItem(key, '10')
            }, STORAGE_KEY)

            const dt = new DataTableFixturePage(page)
            await dt.goto({ pageSize: '50' })

            await dt.waitForRows()
            expect(await dt.rowCount()).toBe(50)
        })
    })

    // ─── Export ───────────────────────────────────────────────────────────────

    test.describe('export', () => {
        test('Export CSV triggers a download with .csv extension', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            const downloadPromise = page.waitForEvent('download')
            await dt.exportCSVButton().click()
            const download = await downloadPromise

            expect(download.suggestedFilename()).toMatch(/\.csv$/i)
        })

        test('Export Excel triggers a download with .xlsx extension', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            const downloadPromise = page.waitForEvent('download')
            await dt.exportExcelButton().click()
            const download = await downloadPromise

            expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i)
        })
    })

    // ─── States ───────────────────────────────────────────────────────────────

    test.describe('states', () => {
        test('loading state: skeleton row is visible with ?sim=loading', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto({ sim: 'loading' })

            await expect(dt.loadingSkeleton()).toBeVisible({ timeout: 5000 })
            expect(await dt.rowCount()).toBe(0)
        })

        test('error state: error row is visible with ?sim=error', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto({ sim: 'error' })

            await expect(dt.errorState()).toBeVisible({ timeout: 5000 })
            expect(await dt.rowCount()).toBe(0)
        })

        test('empty state: empty row is visible when search returns no results', async ({ page }) => {
            const dt = new DataTableFixturePage(page)
            await dt.goto()

            await dt.searchBox().fill('___no_match___')
            await expect(dt.emptyState()).toBeVisible({ timeout: 10000 })
        })
    })
})
