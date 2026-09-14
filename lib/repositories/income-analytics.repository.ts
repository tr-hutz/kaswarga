/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

export async function findApprovedIncomesByYear(rtId: string, year: number) {
    const { data, error } = await (supabase as any)
        .from('income_transactions')
        .select('amount, income_category, received_at')
        .eq('rt_id', rtId)
        .eq('status', 'approved')
        .gte('received_at', `${year}-01-01`)
        .lte('received_at', `${year}-12-31`)

    if (error) throw error
    return (data ?? []) as Array<{
        amount:           number
        income_category:  string
        received_at:      string
    }>
}
