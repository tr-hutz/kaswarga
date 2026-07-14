import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
    await expect(this.page.locator('input[type="email"]')).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.page.locator('input[type="email"]').fill(email)
    await this.page.locator('input[type="password"]').fill(password)
    await this.page.locator('button[type="submit"]').click()
  }

  async expectError() {
    await expect(
      this.page.locator('.bg-red-50').first()
    ).toBeVisible({ timeout: 5000 })
  }

  async expectRedirectAfterLogin() {
    await this.page.waitForURL(url => !url.pathname.includes('/login'), {
      timeout: 60000,
    })
  }
}
