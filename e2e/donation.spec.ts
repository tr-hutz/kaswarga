/**
 * Donation flow:
 *
 * - TREASURER creates donations, views the donation list and detail drawer
 * - RT CHAIR activates a DRAFT donation
 * - RESIDENT / STAFF donate via the active donations banner on Beranda / Dasbor
 * - Maker-checker: a user who submitted a donation cannot approve/reject it
 * - TREASURER (as checker) sees Setujui/Tolak on donations submitted by others
 *
 * Tests that require an active donation in the database are guarded with
 * test.skip() when none exists, following the same pattern as income.spec.ts.
 */
import { test, expect, type Browser } from '@playwright/test'
import { DonationPage }               from './pages/DonationPage'
import { IncomePage }                 from './pages/IncomePage'
import { refreshAdminSession }        from './utils/refreshSession'
import path                           from 'path'

// ---------------------------------------------------------------------------
// Treasurer: donation list tab
// ---------------------------------------------------------------------------

test.describe('donation list tab (treasurer)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

    test('Donasi tab is visible on the income page', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await expect(page.locator('[data-testid="tab-donations"]')).toBeVisible()
    })

    test('switching to Donasi tab shows the donation list', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await expect(page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first()).toBeVisible()
    })

    test('"Buat Donasi" button is visible for treasurer', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await expect(dp.addDonationButton()).toBeVisible()
    })

    test('opens the create donation form modal', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await dp.openCreateForm()
        await expect(dp.nameInput()).toBeVisible()
        await expect(dp.codeInput()).toBeVisible()
        await expect(dp.formSaveButton()).toBeVisible()
        await expect(dp.formCancelButton()).toBeVisible()
    })

    test('cancel closes the create donation form', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await dp.openCreateForm()
        await dp.cancelForm()
        await expect(dp.formModal()).not.toBeVisible()
    })

    test('save without required fields stays in the form', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await dp.openCreateForm()
        await dp.formSaveButton().click()
        await expect(dp.formModal()).toBeVisible()
    })

    test('creates a DRAFT donation with valid data', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await dp.openCreateForm()

        const uniqueCode = `E2EDON${Date.now().toString().slice(-5)}`
        await dp.fillDonationForm({ name: 'E2E Donasi Test', code: uniqueCode, target: 1000000 })
        await dp.saveDonation()

        await expect(dp.formModal()).not.toBeVisible({ timeout: 20000 })
        await expect(page.getByText('E2E Donasi Test').first()).toBeVisible({ timeout: 20000 })
    })

    test('clicking a donation row opens the detail drawer', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()

        const rowCount = await dp.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        await dp.clickRow(0)
        await expect(dp.detailDrawer()).toBeVisible({ timeout: 10000 })
    })

    test('detail drawer shows the donation name heading', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()

        const rowCount = await dp.tableRows().count()
        if (rowCount === 0) { test.skip(); return }

        await dp.clickRow(0)

        await expect(dp.detailDrawer()).toBeVisible({ timeout: 10000 })
        // The drawer always renders the donation name as an h3 heading
        await expect(dp.detailDrawer().locator('h3').first()).toBeVisible({ timeout: 5000 })
    })
})

// ---------------------------------------------------------------------------
// RT Chair: donation tab + activation
// ---------------------------------------------------------------------------

test.describe('donation tab (chair)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/chair.json') })

    test('Donasi tab is visible for chair', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await expect(page.locator('[data-testid="tab-donations"]')).toBeVisible()
    })

    test('"Buat Donasi" button is NOT visible for chair', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()
        await expect(dp.addDonationButton()).not.toBeVisible()
    })

    test('Aktifkan button is visible in detail drawer for DRAFT donation', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()

        // find a DRAFT donation row
        const draftRow = page.locator('[data-testid="dt-row"]').filter({ hasText: /Draf/i }).first()
        const count    = await draftRow.count()
        if (count === 0) { test.skip(); return }

        await draftRow.click()
        await expect(dp.detailDrawer()).toBeVisible({ timeout: 10000 })
        await expect(dp.activateButton()).toBeVisible({ timeout: 5000 })
    })

    test('activating a DRAFT donation shows ACTIVE status', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoIncome()
        await dp.switchToDonationsTab()

        const draftRow = page.locator('[data-testid="dt-row"]').filter({ hasText: /Draf/i }).first()
        const count    = await draftRow.count()
        if (count === 0) { test.skip(); return }

        await draftRow.click()
        await expect(dp.detailDrawer()).toBeVisible({ timeout: 10000 })

        await dp.activateButton().click()

        // Drawer should close or status badge should change to Aktif
        await expect(dp.detailDrawer().getByText(/Aktif/i)).toBeVisible({ timeout: 15000 })
    })
})

// ---------------------------------------------------------------------------
// Active donations banner — Beranda (resident)
// ---------------------------------------------------------------------------

test.describe('donations banner on Beranda (resident)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/resident.json') })

    test('home page loads without error', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()
        await expect(page.getByRole('heading').first()).toBeVisible()
    })

    test('donations banner is visible when active donations exist', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        await expect(dp.banner()).toBeVisible()
        await expect(dp.bannerToggle()).toBeVisible()
    })

    test('banner can be collapsed and expanded', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        // Ensure banner is expanded first
        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) {
            await dp.bannerToggle().click()
            await expect(dp.bannerContent()).toBeVisible({ timeout: 3000 })
        }

        // Collapse
        await dp.bannerToggle().click()
        await expect(dp.bannerContent()).not.toBeVisible({ timeout: 3000 })

        // Expand again
        await dp.bannerToggle().click()
        await expect(dp.bannerContent()).toBeVisible({ timeout: 3000 })
    })

    test('each donation card shows a Donasi Sekarang button', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        // Ensure expanded
        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) await dp.bannerToggle().click()

        await expect(dp.donateBtnOnCard(0)).toBeVisible({ timeout: 5000 })
    })

    test('clicking Donasi Sekarang opens the donation form', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) await dp.bannerToggle().click()

        const cardCount = await dp.donationCards().count()
        if (cardCount === 0) { test.skip(); return }

        await dp.openDonationForm(0)
        await expect(dp.donationModal()).toBeVisible()
    })

    test('Batal in donation form closes the form', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) await dp.bannerToggle().click()

        const cardCount = await dp.donationCards().count()
        if (cardCount === 0) { test.skip(); return }

        await dp.openDonationForm(0)
        await dp.donationCancelButton().click()
        await expect(dp.donationModal()).not.toBeVisible({ timeout: 5000 })
    })

    test('submitting a donation shows a success toast', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) await dp.bannerToggle().click()

        const cardCount = await dp.donationCards().count()
        if (cardCount === 0) { test.skip(); return }

        await dp.openDonationForm(0)
        await dp.donationAmountInput().fill('50000')
        await dp.donationSaveButton().click()

        // Toast confirms success; form closes
        await expect(page.getByText(/berhasil/i)).toBeVisible({ timeout: 20000 })
        await expect(dp.donationModal()).not.toBeVisible({ timeout: 20000 })
    })
})

// ---------------------------------------------------------------------------
// Active donations banner — Dasbor (treasurer)
// ---------------------------------------------------------------------------

test.describe('donations banner on Dasbor (treasurer)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/treasurer.json') })

    test.beforeAll(async ({ browser }: { browser: Browser }) => {
        await refreshAdminSession(browser)
    })

    test('Dasbor page loads', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoDasbor()
        await expect(page.getByRole('heading').first()).toBeVisible()
    })

    test('donations banner is visible on Dasbor when active donations exist', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoDasbor()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        await expect(dp.banner()).toBeVisible()
    })

    test('donation cards show a refresh button', async ({ page }) => {
        const dp = new DonationPage(page)
        await dp.gotoDasbor()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) await dp.bannerToggle().click()

        const cardCount = await dp.donationCards().count()
        if (cardCount === 0) { test.skip(); return }

        // Each card has a refresh button (aria-label="Muat ulang")
        await expect(dp.donationCards().first().getByRole('button', { name: /Muat ulang/i })).toBeVisible()
    })
})

// ---------------------------------------------------------------------------
// Maker-checker: RT Chair submits and cannot approve their own donation
// ---------------------------------------------------------------------------

test.describe('maker-checker self-submission note (chair)', () => {
    test.use({ storageState: path.join(__dirname, '.auth/chair.json') })

    test('chair submitting a donation cannot approve it (self-submission note shown)', async ({ page }) => {
        const dp     = new DonationPage(page)
        const income = new IncomePage(page)

        // Go to Beranda and donate via banner
        await dp.gotoHome()

        const bannerCount = await dp.banner().count()
        if (bannerCount === 0) { test.skip(); return }

        const contentVisible = await dp.bannerContent().isVisible()
        if (!contentVisible) await dp.bannerToggle().click()

        const cardCount = await dp.donationCards().count()
        if (cardCount === 0) { test.skip(); return }

        await dp.openDonationForm(0)
        await dp.donationAmountInput().fill('25000')
        await dp.donationSaveButton().click()

        // Wait for success toast / form close
        await expect(dp.donationModal()).not.toBeVisible({ timeout: 20000 })

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
