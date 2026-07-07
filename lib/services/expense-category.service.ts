import { supabase } from '../supabase'

export async function getExpenseCategories() {
    const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name')
        .order('sort_order')

    if (error) throw error
    return data || []
}
