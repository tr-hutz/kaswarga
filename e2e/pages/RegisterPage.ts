import { Page, expect } from '@playwright/test'

export class RegisterPage {
  constructor(private page: Page) {}

  async gotoLanding() {
    await this.page.goto('/register')
  }

  async gotoRt() {
    await this.page.goto('/register/rt')
  }

  async gotoResident() {
    await this.page.goto('/register/resident')
  }

  async expectLandingOptions() {
    await expect(this.page.getByRole('link', { name: /RT baru/i })).toBeVisible()
    await expect(this.page.getByRole('link', { name: /Warga/i })).toBeVisible()
  }

  async expectRtFormVisible() {
    await expect(this.page.locator('input[name="name"], input[placeholder*="RT"]').first()).toBeVisible()
  }

  async expectResidentFormVisible() {
    await expect(this.page.locator('input').first()).toBeVisible()
  }

  async clickBackFromRt() {
    await this.page.getByRole('link', { name: /Kembali/i }).click()
    await this.page.waitForURL('**/register')
  }
}
