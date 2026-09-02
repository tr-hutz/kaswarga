import { findExpenseCategories } from '@/lib/repositories/expense-category.repository'

export async function getExpenseCategories() {
    return findExpenseCategories()
}
