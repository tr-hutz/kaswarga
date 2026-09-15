import { type Page, type Locator, expect } from '@playwright/test'

const STORAGE_KEY = 'dt:pageSize:dt-fixture'

export class DataTableFixturePage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    async goto(params?: Record<string, string>) {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        await this.page.goto(`/test/data-table${qs}`)
        // Wait for the fixture to finish mounting (no auth spinner)
        await this.page.waitForLoadState('networkidle')
    }

    async clearPageSizePreference() {
        await this.page.addInitScript((key) => {
            localStorage.removeItem(key)
        }, STORAGE_KEY)
    }

    // ─── Toolbar ──────────────────────────────────────────────────────────────

    searchBox(): Locator {
        return this.page.getByPlaceholder('Search items...')
    }

    statusFilter(): Locator {
        return this.page.getByTestId('dt-status-filter')
    }

    exportExcelButton(): Locator {
        return this.page.getByRole('button', { name: /Ekspor Excel/i })
    }

    // ─── Column headers ───────────────────────────────────────────────────────

    sortButton(columnTitle: string): Locator {
        return this.page.locator('thead').getByRole('button', { name: columnTitle })
    }

    // ─── Table body ───────────────────────────────────────────────────────────

    rows(): Locator {
        return this.page.getByTestId('dt-row')
    }

    loadingSkeleton(): Locator {
        return this.page.getByTestId('dt-loading')
    }

    emptyState(): Locator {
        return this.page.getByTestId('dt-empty')
    }

    errorState(): Locator {
        return this.page.getByTestId('dt-error')
    }

    // ─── Pagination ───────────────────────────────────────────────────────────

    pageSizeSelect(): Locator {
        return this.page.getByTestId('dt-page-size')
    }

    prevButton(): Locator {
        return this.page.getByRole('button', { name: /Sebelumnya/i })
    }

    nextButton(): Locator {
        return this.page.getByRole('button', { name: /Selanjutnya/i })
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    async rowCount(): Promise<number> {
        return this.rows().count()
    }

    async firstRowText(): Promise<string> {
        return (await this.rows().first().textContent()) ?? ''
    }

    async waitForRows(timeout = 10000) {
        await expect(this.rows().first()).toBeVisible({ timeout })
    }

    async waitForNoRows(timeout = 10000) {
        await expect(this.rows().first()).not.toBeVisible({ timeout })
    }
}
