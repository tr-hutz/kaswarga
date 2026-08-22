/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase }      from '../supabase'
import type { QueryOptions, PageResult } from '../types/query'

const TABLE = 'income_campaigns'

const SELECT_FIELDS = `
    id,
    rt_id,
    name,
    contribution_code_prefix,
    description,
    target_amount,
    starts_at,
    ends_at,
    status,
    cancelled_note,
    created_by,
    updated_by,
    created_at,
    updated_at
`

// Server-side reads use supabaseAdmin (browser client has no JWT in API routes).
// Client-side reads (findCampaignById) use the browser supabase client.

export async function findCampaignsPaginated(
    rtId: string,
    query: QueryOptions,
): Promise<PageResult<any>> {
    const { supabaseAdmin } = await import('../supabase-admin')
    const from = (query.page - 1) * query.pageSize
    const to   = from + query.pageSize - 1

    let q = (supabaseAdmin as any)
        .from(TABLE)
        .select(SELECT_FIELDS, { count: 'exact' })
        .eq('rt_id', rtId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    const term = query.search?.trim()
    if (term) {
        q = q.ilike('name', `%${term}%`)
    }

    const status = query.filters?.status
    if (status && status !== 'all') {
        q = q.eq('status', status)
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

export async function findActiveCampaigns(rtId: string): Promise<any[]> {
    const { supabaseAdmin } = await import('../supabase-admin')
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await (supabaseAdmin as any)
        .from(TABLE)
        .select(SELECT_FIELDS)
        .eq('rt_id', rtId)
        .eq('status', 'ACTIVE')
        .lte('starts_at', today)
        .is('deleted_at', null)
        .or(`ends_at.is.null,ends_at.gte.${today}`)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
}

// Used from income.service.ts which can run client-side — keep using browser client.
export async function findCampaignById(id: string): Promise<any | null> {
    const { data, error } = await (supabase as any)
        .from(TABLE)
        .select(SELECT_FIELDS)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) throw error
    return data
}

export async function getCampaignProgress(campaignId: string): Promise<{ approved_amount: number; pending_amount: number; donor_count: number }> {
    const { supabaseAdmin } = await import('../supabase-admin')
    const { data, error } = await (supabaseAdmin as any)
        .from('income_transactions')
        .select('amount, status')
        .eq('campaign_id', campaignId)
        .eq('income_category', 'DONATION')
        .is('deleted_at', null)

    if (error) throw error

    let approved_amount = 0
    let pending_amount  = 0
    let donor_count     = 0

    for (const row of (data ?? [])) {
        if (row.status === 'approved') {
            approved_amount += row.amount ?? 0
            donor_count++
        } else if (row.status === 'pending') {
            pending_amount += row.amount ?? 0
        }
    }

    return { approved_amount, pending_amount, donor_count }
}

export async function insertCampaign(payload: Record<string, unknown>): Promise<any> {
    const { data, error } = await (supabase as any)
        .from(TABLE)
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateCampaign(id: string, payload: Record<string, unknown>): Promise<any> {
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

export async function softDeleteCampaign(id: string, userId: string): Promise<void> {
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

export async function countCampaignContributions(campaignId: string): Promise<number> {
    const { supabaseAdmin } = await import('../supabase-admin')
    const { count, error }  = await (supabaseAdmin as any)
        .from('income_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)

    if (error) throw error
    return count ?? 0
}

export async function findCampaignContributions(campaignId: string): Promise<{ monetary: any[]; inKind: any[] }> {
    const { supabaseAdmin } = await import('../supabase-admin')
    const { data, error } = await (supabaseAdmin as any)
        .from('income_transactions')
        .select(`
            id, income_category, amount, status, contribution_code,
            received_at, payer_name, is_anonymous,
            residents:residents(id, name),
            in_kind_description, in_kind_quantity, in_kind_unit
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('received_at', { ascending: false })

    if (error) throw error

    const rows = data ?? []
    return {
        monetary: rows.filter((r: any) => r.income_category === 'DONATION'),
        inKind:   rows.filter((r: any) => r.income_category === 'IN_KIND'),
    }
}
