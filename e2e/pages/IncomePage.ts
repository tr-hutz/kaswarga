import { type Page, type Locator, expect } from '@playwright/test'
import { waitForShell } from '../utils/waitForShell'

export class IncomePage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    async goto() {
        await this.page.goto('/income')
        await expect(this.page).toHaveURL(/\/income/)
        await waitForShell(this.page, /\/income/)
        await this.page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first().waitFor({ timeout: 15000 })
    }

    addButton(): Locator {
        return this.page.getByRole('button', { name: /Tambah/i })
    }

    modal(): Locator {
        return this.page.locator('.fixed.inset-0').filter({ has: this.page.locator('form') })
    }

    incomeNameInput(): Locator {
        return this.modal().locator('input[type="text"]').first()
    }

    categorySelect(): Locator {
        return this.modal().locator('select').first()
    }

    sourceTypeSelect(): Locator {
        return this.modal().locator('select').nth(1)
    }

    amountInput(): Locator {
        return this.modal().locator('input[type="number"]')
    }

    dateInput(): Locator {
        return this.modal().locator('input[type="date"]')
    }

    saveButton(): Locator {
        return this.modal().getByRole('button', { name: 'Simpan' })
    }

    cancelButton(): Locator {
        return this.modal().getByRole('button', { name: 'Batal' })
    }

    async openCreateForm() {
        await this.addButton().click()
        await expect(this.modal()).toBeVisible()
    }

    async fillIncomeForm(opts: { name: string; amount: number; date?: string }) {
        await this.incomeNameInput().fill(opts.name)
        const catCount = await this.categorySelect().locator('option').count()
        if (catCount > 1) await this.categorySelect().selectOption({ index: 1 })
        await this.amountInput().fill(String(opts.amount))
        if (opts.date) await this.dateInput().fill(opts.date)
    }

    async saveIncome() {
        await this.saveButton().click()
    }

    async cancelForm() {
        await this.cancelButton().click()
    }

    drawer(): Locator {
        return this.page.locator('[data-testid="income-drawer"]')
    }

    drawerCloseButton(): Locator {
        return this.drawer().locator('[data-testid="close-drawer"]')
    }

    tableRows(): Locator {
        return this.page.locator('[data-testid="dt-row"]')
    }

    async clickRow(index = 0) {
        await this.tableRows().nth(index).click()
        await this.drawer().waitFor({ timeout: 5000 })
    }

    async closeDrawer() {
        await this.drawerCloseButton().click()
    }
}
