import { type Page, type Locator, expect } from '@playwright/test'

export class RtRegistrationPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/rt/registration')
    await expect(this.page).toHaveURL(/\/rt\/registration/)
  }

  pendingTab(): Locator {
    return this.page.getByRole('button', { name: /Menunggu/i })
  }

  cards(): Locator {
    // Each registration card is a rounded border div
    return this.page.locator('[data-testid="rt-registration-card"]')
      .or(this.page.locator('.border.rounded-2xl').filter({ has: this.page.locator('button', { hasText: /Setujui|Tolak/ }) }))
  }

  async expandCard(index = 0) {
    const chevrons = this.page.locator('button').filter({ has: this.page.locator('svg') })
    await chevrons.nth(index).click()
  }

  async approveCard(index = 0) {
    const approveButtons = this.page.getByRole('button', { name: 'Setujui' })
    await approveButtons.nth(index).click()
  }

  async rejectCard(index = 0) {
    this.page.on('dialog', dialog => dialog.accept())
    const rejectButtons = this.page.getByRole('button', { name: 'Tolak' })
    await rejectButtons.nth(index).click()
  }

  emptyMessage(): Locator {
    return this.page.getByText(/Tidak ada pendaftaran/i)
  }
}
