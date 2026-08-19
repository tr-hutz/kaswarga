/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin }  from '@/lib/supabase-admin'
import type { QueryOptions, PageResult } from '@/lib/types/query'
import type { ImportJob } from '@/lib/import/types'

const TABLE = 'import_jobs'

export async function findImportJobsPaginated(
    rtId: string,
    query: QueryOptions,
): Promise<PageResult<ImportJob>> {
    const from = (query.page - 1) * query.pageSize
    const to   = from + query.pageSize - 1

    let q = (supabaseAdmin as any)
        .from(TABLE)
        .select('*', { count: 'exact' })
        .eq('rt_id', rtId)
        .order('created_at', { ascending: false })

    const status = query.filters?.status
    if (status && status !== 'all') {
        q = q.eq('status', status)
    }

    const importType = query.filters?.import_type
    if (importType && importType !== 'all') {
        q = q.eq('import_type', importType)
    }

    const search = query.search?.trim()
    if (search) {
        q = q.ilike('filename', `%${search}%`)
    }

    q = q.range(from, to)

    const { data, error, count } = await q
    if (error) throw error

    const total = count ?? 0
    return {
        data:       data ?? [],
        total,
        page:       query.page,
        pageSize:   query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
}
