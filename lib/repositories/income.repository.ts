/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase }      from '@/lib/supabase'
import type { QueryOptions, PageResult } from '@/lib/types/query'

const TABLE = 'income_transactions'

const SELECT_FIELDS = `
    id,
    rt_id,
    income_category,
    income_name,
    resident_id,
    residents:residents(id, name),
    source_type,
    payer_name,
    is_anonymous,
    payment_method,
    reference_number,
    amount,
    received_at,
    status,
    notes,
    attachment_url,
    campaign_id,
    contribution_code,
    in_kind_description,
    in_kind_quantity,
    in_kind_unit,
    created_by,
    approved_by,
    approved_at,
    rejected_at,
    rejection_note,
    created_at,
    updated_at
`

export async function findIncomesPaginated(
    rtId: string,
    query: QueryOptions,
): Promise<PageResult<any>> {
    const from = (query.page - 1) * query.pageSize
    const to   = from + query.pageSize - 1

    let q = (supabase as any)
        .from(TABLE)
        .select(SELECT_FIELDS, { count: 'exact' })
        .eq('rt_id', rtId)
        .is('deleted_at', null)
        .order('received_at', { ascending: false })

    const term = query.search?.trim()
    if (term) {
        q = q.or(`income_name.ilike.%${term}%,payer_name.ilike.%${term}%,reference_number.ilike.%${term}%`)
    }

    const status = query.filters?.status
    if (status && status !== 'all') {
        q = q.eq('status', status)
    }

    const category = query.filters?.income_category
    if (category && category !== 'all') {
        q = q.eq('income_category', category)
    }

    const sourceType = query.filters?.source_type
    if (sourceType && sourceType !== 'all') {
        q = q.eq('source_type', sourceType)
    }

    const paymentMethod = query.filters?.payment_method
    if (paymentMethod && paymentMethod !== 'all') {
        q = q.eq('payment_method', paymentMethod)
    }

    const campaignId = query.filters?.campaign_id
    if (campaignId) {
        q = q.eq('campaign_id', campaignId)
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

export async function findIncomeById(id: string): Promise<any | null> {
    const { data, error } = await (supabase as any)
        .from(TABLE)
        .select(SELECT_FIELDS)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) throw error
    return data
}

export async function insertIncome(payload: Record<string, unknown>): Promise<any> {
    const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateIncome(id: string, payload: Record<string, unknown>): Promise<any> {
    const { data, error } = await (supabase as any)
        .from(TABLE)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function softDeleteIncome(id: string, userId: string): Promise<void> {
    const { error } = await (supabase as any)
        .from(TABLE)
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: userId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .is('deleted_at', null)

    if (error) throw error
}
