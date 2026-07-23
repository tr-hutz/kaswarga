import { type Page, type Locator, expect } from '@playwright/test'
import { waitForShell } from '../utils/waitForShell'

export class ResidentsPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/residents')
    await expect(this.page).toHaveURL(/\/residents/)
    await waitForShell(this.page, /\/residents/)
  }

  addButton(): Locator {
    return this.page.getByRole('button', { name: /Tambah/i })
  }

  modal(): Locator {
    return this.page.locator('.fixed.inset-0').filter({ has: this.page.locator('form') })
  }

  nameInput(): Locator {
    return this.page.locator('input[placeholder*="Nama"]')
  }

  blockInput(): Locator {
    return this.page.locator('input[placeholder*="Blok"]')
  }

  houseNumberInput(): Locator {
    return this.page.locator('input[placeholder="12"]')
  }

  phoneInput(): Locator {
    return this.page.locator('input[placeholder*="08"]')
  }

  saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Simpan' })
  }

  cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'Batal' })
  }

  async openAddModal() {
    await this.addButton().click()
    await expect(this.modal()).toBeVisible()
  }

  async fillResidentForm(name: string, block?: string, houseNumber?: string, phone?: string) {
    await this.nameInput().fill(name)
    if (block)       await this.blockInput().fill(block)
    if (houseNumber) await this.houseNumberInput().fill(houseNumber)
    if (phone)       await this.phoneInput().fill(phone)
  }

  async saveResident() {
    await this.saveButton().click()
  }

  async cancelModal() {
    await this.cancelButton().click()
  }

  // Pending requests section
  pendingSection(): Locator {
    return this.page.getByText(/Permintaan Bergabung/i).locator('../..')
  }

  pendingRows(): Locator {
    return this.page.locator('table').filter({ has: this.page.locator('th', { hasText: /Nama/ }) })
      .locator('tbody tr')
  }

  async approvePendingRequest(index = 0) {
    const rows = this.pendingRows()
    const row  = rows.nth(index)
    await row.getByRole('button', { name: 'Setujui' }).click()
  }

  importButton(): Locator {
    return this.page.getByRole('button', { name: /Impor/i })
  }

  importModal(): Locator {
    return this.page.locator('.fixed.inset-0').filter({ hasText: /Impor Data Warga/i })
  }

  downloadTemplateButton(): Locator {
    return this.importModal().getByRole('button', { name: /Unduh Template/i })
  }

  async rejectPendingRequest(index = 0) {
    this.page.on('dialog', dialog => dialog.accept())
    const rows = this.pendingRows()
    const row  = rows.nth(index)
    await row.getByRole('button', { name: 'Tolak' }).click()
  }
}
