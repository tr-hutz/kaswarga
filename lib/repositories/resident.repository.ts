import { supabase } from '../supabase'
import type { Database } from '../../types/database'
import type { QueryOptions, PageResult } from '../types/query'
import { applyResidentFilters } from '../helpers/filter-resident'

type ResidentRow    = Database['public']['Tables']['residents']['Row']
type ResidentInsert = Database['public']['Tables']['residents']['Insert']
type ResidentUpdate = Database['public']['Tables']['residents']['Update']

export async function findResidents(options: {
    rtId?: string | null
    search?: string | null
    status?: string | null
}) {
    let query = supabase
        .from('residents')
        .select(`
            id,
            name,
            block,
            house_number,
            phone,
            rt_id,
            active,
            created_at,
            payments:payments (
                id,
                year,
                payment_details (
                    id,
                    month,
                    amount
                )
            )
        `)
        .is('deleted_at', null)
        .order('name', { ascending: true })

    query = applyResidentFilters(query, options)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function findResidentSnapshot(id: string) {
    const { data } = await supabase
        .from('residents')
        .select('name, block, house_number, phone')
        .eq('id', id)
        .single()
    return data
}

export async function findResidentPaymentHistory(
    residentId: string,
    year?: number | null
) {
    let query = supabase
        .from('payments')
        .select(`
            id,
            date,
            year,
            resident_id,
            payment_details (
                id,
                month,
                amount
            )
        `)
        .eq('resident_id', residentId)
        .order('date', { ascending: false })

    if (year) {
        query = query.eq('year', year)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
}

export async function insertResident(payload: ResidentInsert) {
    const { data, error } = await supabase
        .from('residents')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function findResidentsPaginated(
    rtId: string,
    query: QueryOptions,
): Promise<PageResult<ResidentRow>> {
    const from = (query.page - 1) * query.pageSize
    const to   = from + query.pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any)
        .from('residents')
        .select('id, name, block, house_number, phone, active, rt_id, created_at', { count: 'exact' })
        .eq('rt_id', rtId)
        .is('deleted_at', null)

    const term = query.search?.trim()
    if (term) {
        q = q.or(`name.ilike.%${term}%,block.ilike.%${term}%,house_number.ilike.%${term}%`)
    }

    const active = query.filters?.active
    if (active !== undefined && active !== null && active !== '' && active !== 'all') {
        q = q.eq('active', active === 'true' || active === true)
    }

    const sortBy  = query.sortBy ?? 'name'
    const sortAsc = (query.sortDirection ?? 'asc') === 'asc'
    q = q.order(sortBy, { ascending: sortAsc })

    q = q.range(from, to)

    const { data, error, count } = await q
    if (error) throw error

    const total = count ?? 0
    return {
        data:       (data ?? []) as ResidentRow[],
        total,
        page:       query.page,
        pageSize:   query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
    }
}

export async function updateResidentById(id: string, payload: ResidentUpdate) {
    const { data, error } = await supabase
        .from('residents')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}
