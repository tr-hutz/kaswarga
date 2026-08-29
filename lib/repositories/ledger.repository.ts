import { supabase } from '../supabase'
import type { Database } from '../../types/database'
import type { QueryOptions, PageResult } from '../types/query'

type LedgerRow = Database['public']['Tables']['ledger']['Row']

export async function findLedger(options: { rtId: string; search?: string }): Promise<LedgerRow[]> {
    let query = supabase
        .from('ledger')
        .select('*')
        .eq('rt_id', options.rtId)
        .eq('active', true)
        .order('date', { ascending: false })

    if (options.search) {
        query = query.ilike('description', `%${options.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findLedgerPaginated(
    rtId: string,
    query: QueryOptions,
): Promise<PageResult<LedgerRow>> {
    const from = (query.page - 1) * query.pageSize
    const to   = from + query.pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any)
        .from('ledger')
        .select('*', { count: 'exact' })
        .eq('rt_id', rtId)
        .eq('active', true)
        .order('date', { ascending: false })

    const term = query.search?.trim()
    if (term) {
        q = q.ilike('description', `%${term}%`)
    }

    if (query.filters?.type && query.filters.type !== 'all') {
        q = q.eq('type', query.filters.type)
    }

    q = q.range(from, to)

    const { data, error, count } = await q
    if (error) throw error

    const total = count ?? 0
    return {
        data:       (data ?? []) as LedgerRow[],
        total,
        page:       query.page,
        pageSize:   query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
    }
}

export async function findLedgerTotals(
    rtId: string,
): Promise<{ income: number; expense: number }> {
    const [incomeResult, expenseResult] = await Promise.all([
        supabase.from('ledger').select('amount').eq('rt_id', rtId).eq('active', true).eq('type', 'pemasukan'),
        supabase.from('ledger').select('amount').eq('rt_id', rtId).eq('active', true).eq('type', 'pengeluaran'),
    ])
    const income  = (incomeResult.data  ?? []).reduce((s, r) => s + (r.amount || 0), 0)
    const expense = (expenseResult.data ?? []).reduce((s, r) => s + (r.amount || 0), 0)
    return { income, expense }
}
