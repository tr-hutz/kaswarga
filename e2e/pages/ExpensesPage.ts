import { type Page, type Locator, expect } from '@playwright/test'
import { waitForShell } from '../utils/waitForShell'

export class ExpensesPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/expenses')
    await expect(this.page).toHaveURL(/\/expenses/)
    await waitForShell(this.page, /\/expenses/)
    // Wait until the table finishes loading (skeleton rows replaced by dt-row or dt-empty)
    await this.page.locator('[data-testid="dt-row"],[data-testid="dt-empty"]').first().waitFor({ timeout: 15000 })
  }

  addButton(): Locator {
    return this.page.getByRole('button', { name: /Tambah/i })
  }

  // ExpenseForm modal
  modal(): Locator {
    return this.page.locator('.fixed.inset-0').filter({ has: this.page.locator('form') })
  }

  dateInput(): Locator {
    return this.modal().locator('input[type="date"]')
  }

  categorySelect(): Locator {
    return this.modal().locator('select')
  }

  amountInput(): Locator {
    return this.modal().locator('[data-testid="expense-amount-input"]')
  }

  recipientInput(): Locator {
    return this.modal().locator('input[placeholder*="vendor"], input[placeholder*="Nama"]')
  }

  descriptionTextarea(): Locator {
    return this.modal().locator('textarea')
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

  async fillExpenseForm(opts: { date: string; amount: number; recipient?: string; description?: string }) {
    await this.dateInput().fill(opts.date)
    await this.amountInput().fill(String(opts.amount))
    if (opts.recipient)   await this.recipientInput().fill(opts.recipient)
    if (opts.description) await this.descriptionTextarea().fill(opts.description)
  }

  async saveExpense() {
    await this.saveButton().click()
  }

  async cancelForm() {
    await this.cancelButton().click()
  }

  // ExpenseDrawer
  drawer(): Locator {
    return this.page.locator('[data-testid="expense-drawer"]')
  }

  drawerCloseButton(): Locator {
    return this.drawer().locator('[data-testid="close-drawer"]')
  }

  approveInDrawer(): Locator {
    return this.page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Setujui' })
  }

  rejectInDrawer(): Locator {
    return this.page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Tolak' })
  }

  rejectReasonTextarea(): Locator {
    return this.page.locator('.fixed.inset-0').last().locator('textarea')
  }

  confirmRejectButton(): Locator {
    return this.page.locator('.fixed.inset-0').last().getByRole('button', { name: 'Konfirmasi Tolak' })
  }

  tableRows(): Locator {
    return this.page.locator('[data-testid="dt-row"]')
  }

  async clickRow(index = 0) {
    await this.tableRows().nth(index).click()
    // Wait for the drawer to open before callers check its contents
    await this.drawer().waitFor({ timeout: 5000 })
  }

  async approveExpense() {
    await this.approveInDrawer().click()
  }

  async rejectExpense(reason?: string) {
    await this.rejectInDrawer().click()
    if (reason) {
      await this.rejectReasonTextarea().fill(reason)
    }
    await this.confirmRejectButton().click()
  }

  async closeDrawer() {
    await this.drawerCloseButton().click()
  }
}
