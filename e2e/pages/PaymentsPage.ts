import { type Page, type Locator, expect } from '@playwright/test'
import { waitForShell } from '../utils/waitForShell'

export class PaymentsPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/payments')
    await expect(this.page).toHaveURL(/\/payments/)
    await waitForShell(this.page, /\/payments/)
    // Wait until the table finishes loading (skeleton rows replaced by dt-row or dt-empty)
    await this.page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first().waitFor({ timeout: 15000 })
  }

  table(): Locator {
    return this.page.locator('table')
  }

  tableRows(): Locator {
    return this.page.locator('[data-testid="dt-row"]')
  }

  drawer(): Locator {
    return this.page.locator('[data-testid="payment-drawer"]')
  }

  approveButton(): Locator {
    return this.drawer().getByRole('button', { name: 'Setujui' })
  }

  rejectButton(): Locator {
    return this.drawer().getByRole('button', { name: 'Tolak' })
  }

  rejectReasonTextarea(): Locator {
    return this.drawer().locator('textarea')
  }

  confirmRejectButton(): Locator {
    return this.drawer().getByRole('button', { name: 'Tolak' }).last()
  }

  closeDrawerButton(): Locator {
    return this.drawer().locator('[data-testid="close-drawer"]')
  }

  async clickFirstPendingRow() {
    // Click the first row — if there are pending rows they will open the drawer
    await this.tableRows().first().click()
    await expect(this.drawer()).toBeVisible()
  }

  async clickRowByIndex(index: number) {
    await this.tableRows().nth(index).click()
    await expect(this.drawer()).toBeVisible()
  }

  async closeDrawer() {
    await this.closeDrawerButton().click()
    await expect(this.drawer()).not.toBeVisible()
  }

  async approvePayment() {
    await this.approveButton().click()
  }

  async rejectPayment(reason?: string) {
    await this.rejectButton().click()
    if (reason) {
      await this.rejectReasonTextarea().fill(reason)
    }
    await this.confirmRejectButton().click()
  }
}
