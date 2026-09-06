import { type Page, type Locator, expect } from '@playwright/test'
import { waitForShell } from '../utils/waitForShell'

export class DonationPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    // -------------------------------------------------------------------------
    // Navigation
    // -------------------------------------------------------------------------

    async gotoIncome() {
        await this.page.goto('/income')
        await expect(this.page).toHaveURL(/\/income/)
        await waitForShell(this.page, /\/income/)
        await this.page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first().waitFor({ timeout: 15000 })
    }

    async switchToDonationsTab() {
        await this.page.locator('[data-testid="tab-donations"]').click()
        await this.page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first().waitFor({ timeout: 15000 })
    }

    async gotoHome() {
        await this.page.goto('/')
        await waitForShell(this.page, /\//)
        // Wait for the donations banner to finish loading so that banner().count()
        // reflects the real post-load state (not the transient loading-spinner state).
        await this.page.locator('[data-testid="donations-banner"] .animate-spin')
            .waitFor({ state: 'hidden', timeout: 8000 })
            .catch(() => {})
    }

    async gotoDasbor() {
        await this.page.goto('/dashboard')
        await waitForShell(this.page, /\/dashboard/)
        await this.page.locator('[data-testid="donations-banner"] .animate-spin')
            .waitFor({ state: 'hidden', timeout: 8000 })
            .catch(() => {})
    }

    // -------------------------------------------------------------------------
    // Donation list (income tab → Donasi)
    // -------------------------------------------------------------------------

    tableRows(): Locator {
        return this.page.locator('[data-testid="dt-row"]')
    }

    addDonationButton(): Locator {
        return this.page.getByRole('button', { name: /Buat Donasi/i })
    }

    // -------------------------------------------------------------------------
    // Donation form modal (create / edit)
    // -------------------------------------------------------------------------

    formModal(): Locator {
        return this.page.locator('[data-testid="donation-form-modal"]')
    }

    nameInput(): Locator {
        return this.formModal().locator('input[type="text"]').first()
    }

    codeInput(): Locator {
        return this.formModal().locator('input.font-mono')
    }

    formSaveButton(): Locator {
        return this.formModal().locator('button[type="submit"]')
    }

    formCancelButton(): Locator {
        return this.formModal().getByRole('button', { name: /Batal/i })
    }

    async openCreateForm() {
        await this.addDonationButton().click()
        await expect(this.formModal()).toBeVisible()
    }

    async fillDonationForm(opts: { name: string; code: string; target?: number }) {
        await this.nameInput().fill(opts.name)
        await this.codeInput().fill(opts.code)
        if (opts.target !== undefined) {
            await this.formModal().locator('[data-testid="donation-target-input"]').fill(String(opts.target))
        }
    }

    async saveDonation() {
        await this.formSaveButton().click()
    }

    async cancelForm() {
        await this.formCancelButton().click()
    }

    async clickRow(index = 0) {
        await this.tableRows().nth(index).click()
        await this.detailDrawer().waitFor({ timeout: 10000 })
    }

    // -------------------------------------------------------------------------
    // Donation detail drawer
    // -------------------------------------------------------------------------

    detailDrawer(): Locator {
        return this.page.locator('[data-testid="donation-detail-drawer"]')
    }

    activateButton(): Locator {
        return this.detailDrawer().locator('[data-testid="donation-activate-btn"]')
    }

    closeDetailDrawer() {
        return this.detailDrawer().locator('button').filter({ has: this.page.locator('svg') }).first()
    }

    // -------------------------------------------------------------------------
    // Active donations banner (Beranda / Dasbor)
    // -------------------------------------------------------------------------

    banner(): Locator {
        return this.page.locator('[data-testid="donations-banner"]')
    }

    bannerToggle(): Locator {
        return this.page.locator('[data-testid="donations-banner-toggle"]')
    }

    bannerContent(): Locator {
        return this.page.locator('[data-testid="donations-banner-content"]')
    }

    donationCards(): Locator {
        return this.page.locator('[data-testid="donation-card"]')
    }

    donateBtnOnCard(index = 0): Locator {
        return this.donationCards().nth(index).locator('[data-testid="donation-donate-btn"]')
    }

    // -------------------------------------------------------------------------
    // Donation form (opened from banner card)
    // -------------------------------------------------------------------------

    donationModal(): Locator {
        return this.page.locator('.fixed.inset-0').filter({ has: this.page.locator('form') })
    }

    donationAmountInput(): Locator {
        return this.donationModal().locator('[data-testid="income-amount-input"]')
    }

    donationSaveButton(): Locator {
        return this.donationModal().getByRole('button', { name: /Simpan/i })
    }

    donationCancelButton(): Locator {
        return this.donationModal().getByRole('button', { name: /Batal/i })
    }

    async openDonationForm(cardIndex = 0) {
        await this.donateBtnOnCard(cardIndex).click()
        await expect(this.donationModal()).toBeVisible()
    }
}
