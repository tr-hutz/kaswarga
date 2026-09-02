import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ExpenseCategoryRow = Database['public']['Tables']['expense_categories']['Row']

export async function findExpenseCategories(): Promise<Pick<ExpenseCategoryRow, 'id' | 'name'>[]> {
    const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name')
        .is('deleted_at', null)
        .order('sort_order')

    if (error) throw error
    return data ?? []
}
