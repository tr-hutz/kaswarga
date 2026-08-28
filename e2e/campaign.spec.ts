/**
 * Campaign and donation flow:
 *
 * - TREASURER creates campaigns, views the campaign list and detail drawer
 * - RT CHAIR activates a DRAFT campaign
 * - RESIDENT / STAFF donate via the active campaigns banner on Beranda / Dasbor
 * - Maker-checker: a user who submitted a donation cannot approve/reject it
 * - TREASURER (as checker) sees Setujui/Tolak on donations submitted by others
 *
 * Tests that require an active campaign in the database are guarded with
 * test.skip() when none exists, following the same pattern as income.spec.ts.
 */
import { test, expect, type Browser } from '@playwright/test'
import { CampaignPage }               from './pages/CampaignPage'
import { IncomePage }                 from './pages/IncomePage'
import { refreshAdminSession }        from './utils/refreshSession'
import path                           from 'path'

// ---------------------------------------------------------------------------
// Treasurer: campaign list tab
// ---------------------------------------------------------------------------

test.describe('campaign list tab (treasurer)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

    test('Kampanye tab is visible on the income page', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await expect(page.locator('[data-testid="tab-campaigns"]')).toBeVisible()
    })

    test('switching to Kampanye tab shows the campaign list', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await expect(page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first()).toBeVisible()
    })

    test('"Buat Kampanye" button is visible for treasurer', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await expect(cp.addCampaignButton()).toBeVisible()
    })

    test('opens the create campaign form modal', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await cp.openCreateForm()
        await expect(cp.nameInput()).toBeVisible()
        await expect(cp.codeInput()).toBeVisible()
        await expect(cp.formSaveButton()).toBeVisible()
        await expect(cp.formCancelButton()).toBeVisible()
    })

    test('cancel closes the create campaign form', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await cp.openCreateForm()
        await cp.cancelForm()
        await expect(cp.formModal()).not.toBeVisible()
    })

    test('save without required fields stays in the form', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await cp.openCreateForm()
        await cp.formSaveButton().click()
        await expect(cp.formModal()).toBeVisible()
    })

    test('creates a DRAFT campaign with valid data', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await cp.openCreateForm()

        const uniqueCode = `E2ECAMP${Date.now().toString().slice(-5)}`
        await cp.fillCampaignForm({ name: 'E2E Kampanye Test', code: uniqueCode, target: 1000000 })
        await cp.saveCampaign()

        await expect(cp.formModal()).not.toBeVisible({ timeout: 20000 })
        await expect(page.getByText('E2E Kampanye Test').first()).toBeVisible({ timeout: 20000 })
    })

    test('clicking a campaign row opens the detail drawer', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()

        const rowCount = await cp.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        await cp.clickRow(0)
        await expect(cp.detailDrawer()).toBeVisible({ timeout: 10000 })
    })

    test('detail drawer shows the campaign name', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()

        const rowCount = await cp.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        const firstRowText = await cp.tableRows().first().textContent()
        await cp.clickRow(0)

        await expect(cp.detailDrawer()).toBeVisible({ timeout: 10000 })
        if (firstRowText) {
            const campaignName = firstRowText.slice(0, 40).trim()
            await expect(cp.detailDrawer().getByText(campaignName, { exact: false })).toBeVisible({ timeout: 5000 })
        }
    })
})

// ---------------------------------------------------------------------------
// RT Chair: campaign tab + activation
// ---------------------------------------------------------------------------

test.describe('campaign tab (chair)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/chair.json') })

    test('Kampanye tab is visible for chair', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await expect(page.locator('[data-testid="tab-campaigns"]')).toBeVisible()
    })

    test('"Buat Kampanye" button is NOT visible for chair', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()
        await expect(cp.addCampaignButton()).not.toBeVisible()
    })

    test('Aktifkan button is visible in detail drawer for DRAFT campaign', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()

        // find a DRAFT campaign row
        const draftRow = page.locator('[data-testid="dt-row"]').filter({ hasText: /Draf/i }).first()
        const count    = await draftRow.count()
        if (count === 0) { test.skip(); return }

        await draftRow.click()
        await expect(cp.detailDrawer()).toBeVisible({ timeout: 10000 })
        await expect(cp.activateButton()).toBeVisible({ timeout: 5000 })
    })

    test('activating a DRAFT campaign shows ACTIVE status', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoIncome()
        await cp.switchToCampaignsTab()

        const draftRow = page.locator('[data-testid="dt-row"]').filter({ hasText: /Draf/i }).first()
        const count    = await draftRow.count()
        if (count === 0) { test.skip(); return }

        await draftRow.click()
        await expect(cp.detailDrawer()).toBeVisible({ timeout: 10000 })

        await cp.activateButton().click()

        // Drawer should close or status badge should change to Aktif
        await expect(cp.detailDrawer().getByText(/Aktif/i)).toBeVisible({ timeout: 15000 })
    })
})

// ---------------------------------------------------------------------------
// Active campaigns banner — Beranda (resident)
// ---------------------------------------------------------------------------

test.describe('campaigns banner on Beranda (resident)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/resident.json') })

    test('home page loads without error', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()
        await expect(page.getByRole('heading').first()).toBeVisible()
    })

    test('campaigns banner is visible when active campaigns exist', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        await expect(cp.banner()).toBeVisible()
        await expect(cp.bannerToggle()).toBeVisible()
    })

    test('banner can be collapsed and expanded', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        // Ensure banner is expanded first
        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) {
            await cp.bannerToggle().click()
            await expect(cp.bannerContent()).toBeVisible({ timeout: 3000 })
        }

        // Collapse
        await cp.bannerToggle().click()
        await expect(cp.bannerContent()).not.toBeVisible({ timeout: 3000 })

        // Expand again
        await cp.bannerToggle().click()
        await expect(cp.bannerContent()).toBeVisible({ timeout: 3000 })
    })

    test('each campaign card shows a Donasi Sekarang button', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        // Ensure expanded
        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) await cp.bannerToggle().click()

        await expect(cp.donateBtnOnCard(0)).toBeVisible({ timeout: 5000 })
    })

    test('clicking Donasi Sekarang opens the donation form', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) await cp.bannerToggle().click()

        const cardCount = await cp.campaignCards().count()
        if (cardCount === 0) { test.skip(); return }

        await cp.openDonationForm(0)
        await expect(cp.donationModal()).toBeVisible()
    })

    test('Batal in donation form closes the form', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) await cp.bannerToggle().click()

        const cardCount = await cp.campaignCards().count()
        if (cardCount === 0) { test.skip(); return }

        await cp.openDonationForm(0)
        await cp.donationCancelButton().click()
        await expect(cp.donationModal()).not.toBeVisible({ timeout: 5000 })
    })

    test('submitting a donation shows a success toast', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) await cp.bannerToggle().click()

        const cardCount = await cp.campaignCards().count()
        if (cardCount === 0) { test.skip(); return }

        await cp.openDonationForm(0)
        await cp.donationAmountInput().fill('50000')
        await cp.donationSaveButton().click()

        // Toast confirms success; form closes
        await expect(page.getByText(/berhasil/i)).toBeVisible({ timeout: 20000 })
        await expect(cp.donationModal()).not.toBeVisible({ timeout: 20000 })
    })
})

// ---------------------------------------------------------------------------
// Active campaigns banner — Dasbor (treasurer)
// ---------------------------------------------------------------------------

test.describe('campaigns banner on Dasbor (treasurer)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
        await refreshAdminSession(browser)
    })

    test('Dasbor page loads', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoDasbor()
        await expect(page.getByRole('heading').first()).toBeVisible()
    })

    test('campaigns banner is visible on Dasbor when active campaigns exist', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoDasbor()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        await expect(cp.banner()).toBeVisible()
    })

    test('campaign cards show a refresh button', async ({ page }) => {
        const cp = new CampaignPage(page)
        await cp.gotoDasbor()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) await cp.bannerToggle().click()

        const cardCount = await cp.campaignCards().count()
        if (cardCount === 0) { test.skip(); return }

        // Each card has a refresh button (aria-label="Muat ulang")
        await expect(cp.campaignCards().first().getByRole('button', { name: /Muat ulang/i })).toBeVisible()
    })
})

// ---------------------------------------------------------------------------
// Maker-checker: RT Chair submits and cannot approve their own donation
// ---------------------------------------------------------------------------

test.describe('maker-checker self-submission note (chair)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/chair.json') })

    test('chair submitting a donation cannot approve it (self-submission note shown)', async ({ page }) => {
        const cp     = new CampaignPage(page)
        const income = new IncomePage(page)

        // Go to Beranda and donate via banner
        await cp.gotoHome()

        const bannerCount = await cp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await cp.bannerContent().isVisible()
        if (!contentVisible) await cp.bannerToggle().click()

        const cardCount = await cp.campaignCards().count()
        if (cardCount === 0) { test.skip(); return }

        await cp.openDonationForm(0)
        await cp.donationAmountInput().fill('25000')
        await cp.donationSaveButton().click()

        // Wait for success toast / form close
        await expect(cp.donationModal()).not.toBeVisible({ timeout: 20000 })

        // Now go to income list and find the pending donation just submitted
        await income.goto()

        // Filter to pending DONATION entries
        const statusSelect   = page.locator('select').filter({ has: page.locator('option[value="pending"]') }).first()
        const categorySelect = page.locator('select').filter({ has: page.locator('option[value="DONATION"]') }).first()

        if (await statusSelect.count())   await statusSelect.selectOption('pending')
        if (await categorySelect.count()) await categorySelect.selectOption('DONATION')

        await page.waitForTimeout(1000)

        const rowCount = await income.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        await income.clickRow(0)
        await expect(income.drawer()).toBeVisible({ timeout: 10000 })

        // The self-submission note should appear instead of approve/reject buttons
        await expect(income.drawer().getByText(/diajukan oleh Anda/i)).toBeVisible({ timeout: 5000 })
        await expect(income.drawer().getByRole('button', { name: /Setujui/i })).not.toBeVisible()
        await expect(income.drawer().getByRole('button', { name: /Tolak/i })).not.toBeVisible()
    })
})

// ---------------------------------------------------------------------------
// Treasurer as checker: approve/reject buttons visible for others' donations
// ---------------------------------------------------------------------------

test.describe('treasurer sees approval buttons for donations submitted by others', () => {
    test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

    test('treasurer opens a pending DONATION row and sees Setujui/Tolak', async ({ page }) => {
        const income = new IncomePage(page)
        await income.goto()

        // Filter to pending DONATION
        const statusSelect   = page.locator('select').filter({ has: page.locator('option[value="pending"]') }).first()
        const categorySelect = page.locator('select').filter({ has: page.locator('option[value="DONATION"]') }).first()

        if (await statusSelect.count())   await statusSelect.selectOption('pending')
        if (await categorySelect.count()) await categorySelect.selectOption('DONATION')

        await page.waitForTimeout(1000)

        const rowCount = await income.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        await income.clickRow(0)
        await expect(income.drawer()).toBeVisible({ timeout: 10000 })

        // Treasurer should see approval buttons (unless this is their own submission)
        const selfNote = income.drawer().getByText(/diajukan oleh Anda/i)
        const isSelf   = await selfNote.isVisible()

        if (!isSelf) {
            await expect(income.drawer().getByRole('button', { name: /Setujui/i })).toBeVisible({ timeout: 5000 })
        }
    })
})
