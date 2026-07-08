import { supabase } from '../supabase'
import type { Database } from '../../types/database'

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
