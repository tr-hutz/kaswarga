import { supabase } from '../supabase'
import type { Database } from '../../types/database'
import { applyExpenseFilters } from '../helpers/filter-pengeluaran'

type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export async function findExpenses(options: {
    rtId?: string | null
    category?: string | null
    search?: string | null
}) {
    let query = supabase
        .from('expenses')
        .select(`
            id,
            receipt_number,
            category,
            description,
            amount,
            recipient,
            date,
            receipt_url,
            status,
            created_by,
            approved_by,
            approved_at,
            rejection_note,
            rt_id
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false })

    query = applyExpenseFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function countExpensesByDateRange(
    rtId: string,
    startOfMonth: string,
    startOfNextMonth: string
): Promise<number> {
    const { count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('rt_id', rtId)
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth)

    return count ?? 0
}

export async function findExpenseSnapshot(id: string) {
    const { data } = await supabase
        .from('expenses')
        .select('category, description, amount, date')
        .eq('id', id)
        .single()
    return data
}

export async function insertExpense(payload: ExpenseInsert) {
    const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateExpenseById(id: string, payload: ExpenseUpdate) {
    const { data, error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}
