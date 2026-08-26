/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Send an income-pending notification to the appropriate reviewer.
 * Routes to TREASURER normally; escalates to CHAIR if the submitter is a TREASURER.
 * Safe to call server-side — uses supabaseAdmin directly, no HTTP round-trip.
 */
export async function notifyIncomeReviewer({
    incomeId,
    rtId,
    incomeName,
    createdBy,
}: {
    incomeId:    string
    rtId:        string
    incomeName:  string | null
    createdBy?:  string | null
}): Promise<void> {
    const { data: rt } = await (supabaseAdmin as any)
        .from('rt').select('maker_checker_enabled').eq('id', rtId).single()
    const makerCheckerEnabled = rt?.maker_checker_enabled ?? true

    let submitterIsTreasurer = false
    if (makerCheckerEnabled && createdBy) {
        const { data: submitterMembership } = await (supabaseAdmin as any)
            .from('memberships')
            .select('role')
            .eq('user_id', createdBy)
            .eq('rt_id', rtId)
            .eq('status', 'active')
            .maybeSingle()
        submitterIsTreasurer = submitterMembership?.role === 'TREASURER'
    }

    const targetRole = (makerCheckerEnabled && submitterIsTreasurer) ? 'CHAIR' : 'TREASURER'

    const { data: reviewers } = await (supabaseAdmin as any)
        .from('memberships')
        .select('user_id')
        .eq('rt_id', rtId)
        .eq('role', targetRole)
        .eq('status', 'active')

    if (!reviewers || reviewers.length === 0) return

    const rows = (reviewers as any[]).map((m: any) => ({
        rt_id:          rtId,
        type:           'income_pending',
        title:          'Pemasukan Baru',
        message:        `Pemasukan "${incomeName || ''}" menunggu persetujuan Anda`,
        entity_type:    'income_transactions',
        entity_id:      incomeId,
        target_user_id: m.user_id,
    }))

    const { error } = await supabaseAdmin.from('notifications').insert(rows)
    if (error) console.error('[incomeNotification] insert failed', error)
}
