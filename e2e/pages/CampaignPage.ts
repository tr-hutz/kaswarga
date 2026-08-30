import { type Page, type Locator, expect } from '@playwright/test'
import { waitForShell } from '../utils/waitForShell'

export class CampaignPage {
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

    async switchToCampaignsTab() {
        await this.page.locator('[data-testid="tab-campaigns"]').click()
        await this.page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first().waitFor({ timeout: 15000 })
    }

    async gotoHome() {
        await this.page.goto('/')
        await waitForShell(this.page, /\//)
        // Wait for the campaigns banner to finish loading so that banner().count()
        // reflects the real post-load state (not the transient loading-spinner state).
        await this.page.locator('[data-testid="campaigns-banner"] .animate-spin')
            .waitFor({ state: 'hidden', timeout: 8000 })
            .catch(() => {})
    }

    async gotoDasbor() {
        await this.page.goto('/dashboard')
        await waitForShell(this.page, /\/dashboard/)
    }

    // -------------------------------------------------------------------------
    // Campaign list (income tab → Kampanye)
    // -------------------------------------------------------------------------

    tableRows(): Locator {
        return this.page.locator('[data-testid="dt-row"]')
    }

    addCampaignButton(): Locator {
        return this.page.getByRole('button', { name: /Buat Kampanye/i })
    }

    // -------------------------------------------------------------------------
    // Campaign form modal (create / edit)
    // -------------------------------------------------------------------------

    formModal(): Locator {
        return this.page.locator('[data-testid="campaign-form-modal"]')
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
        await this.addCampaignButton().click()
        await expect(this.formModal()).toBeVisible()
    }

    async fillCampaignForm(opts: { name: string; code: string; target?: number }) {
        await this.nameInput().fill(opts.name)
        await this.codeInput().fill(opts.code)
        if (opts.target !== undefined) {
            await this.formModal().locator('[data-testid="campaign-target-input"]').fill(String(opts.target))
        }
    }

    async saveCampaign() {
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
    // Campaign detail drawer
    // -------------------------------------------------------------------------

    detailDrawer(): Locator {
        return this.page.locator('[data-testid="campaign-detail-drawer"]')
    }

    activateButton(): Locator {
        return this.detailDrawer().locator('[data-testid="campaign-activate-btn"]')
    }

    closeDetailDrawer() {
        return this.detailDrawer().locator('button').filter({ has: this.page.locator('svg') }).first()
    }

    // -------------------------------------------------------------------------
    // Active campaigns banner (Beranda / Dasbor)
    // -------------------------------------------------------------------------

    banner(): Locator {
        return this.page.locator('[data-testid="campaigns-banner"]')
    }

    bannerToggle(): Locator {
        return this.page.locator('[data-testid="campaigns-banner-toggle"]')
    }

    bannerContent(): Locator {
        return this.page.locator('[data-testid="campaigns-banner-content"]')
    }

    campaignCards(): Locator {
        return this.page.locator('[data-testid="campaign-card"]')
    }

    donateBtnOnCard(index = 0): Locator {
        return this.campaignCards().nth(index).locator('[data-testid="campaign-donate-btn"]')
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
