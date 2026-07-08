import { findExpenseCategories } from '../repositories/expense-category.repository'

export async function getExpenseCategories() {
    return findExpenseCategories()
}
