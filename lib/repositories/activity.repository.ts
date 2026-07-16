import { supabase } from '../supabase'
import type { Database } from '../../types/database'
import type { QueryOptions, PageResult } from '../types/query'

type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row']
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']

export async function findActivities(options: { rtId?: string | null; limit: number }): Promise<ActivityLogRow[]> {
    let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit)

    if (options.rtId) {
        query = query.eq('rt_id', options.rtId)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findActivitiesPaginated(
    rtId: string,
    query: QueryOptions,
): Promise<PageResult<ActivityLogRow>> {
    const from = (query.page - 1) * query.pageSize
    const to   = from + query.pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any)
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('rt_id', rtId)
        .order('created_at', { ascending: false })

    const term = query.search?.trim()
    if (term) {
        q = q.or(`description.ilike.%${term}%,actor_name.ilike.%${term}%`)
    }

    q = q.range(from, to)

    const { data, error, count } = await q
    if (error) throw error

    const total = count ?? 0
    return {
        data:       (data ?? []) as ActivityLogRow[],
        total,
        page:       query.page,
        pageSize:   query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
    }
}

export async function findActivityStats(rtId: string): Promise<{
    total: number
    approvals: number
    expenseCount: number
    residentCount: number
}> {
    const [totalRes, approvalsRes, expenseRes, residentRes] = await Promise.all([
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('rt_id', rtId),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('rt_id', rtId).eq('action', 'APPROVE_PAYMENT'),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('rt_id', rtId).eq('entity_type', 'expenses'),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('rt_id', rtId).eq('entity_type', 'residents'),
    ])
    return {
        total:         totalRes.count    ?? 0,
        approvals:     approvalsRes.count ?? 0,
        expenseCount:  expenseRes.count   ?? 0,
        residentCount: residentRes.count  ?? 0,
    }
}

export async function insertActivity(payload: ActivityLogInsert): Promise<void> {
    const { error } = await supabase
        .from('activity_logs')
        .insert(payload)

    if (error) throw error
}
