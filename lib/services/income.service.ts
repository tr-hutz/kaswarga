/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase }              from '../supabase'
import { getCurrentMembership }  from '../auth/getCurrentMembership'
import {
    insertIncome,
    updateIncome,
    softDeleteIncome,
} from '../repositories/income.repository'
import { findCampaignById } from '../repositories/incomeCampaign.repository'

async function getMembershipContext() {
    const membership = await getCurrentMembership()
    return {
        userId: (membership as any)?.user?.id as string,
        rtId:   (membership as any)?.rt?.id   as string,
    }
}

export async function createIncome(payload: Record<string, unknown>) {
    const { userId, rtId } = await getMembershipContext()

    const insertPayload: Record<string, unknown> = {
        ...payload,
        rt_id:      rtId,
        created_by: userId,
        status:     'pending',
        // Never allow client to set contribution_code
        contribution_code: undefined,
    }
    delete insertPayload['contribution_code']

    // Campaign validation + contribution code generation
    if (insertPayload['campaign_id']) {
        const campaignId = insertPayload['campaign_id'] as string
        const campaign   = await findCampaignById(campaignId)

        if (!campaign || campaign.rt_id !== rtId) {
            throw new Error('Campaign not found')
        }
        if (campaign.status !== 'ACTIVE') {
            throw new Error('Campaign is not active')
        }

        const today = new Date().toISOString().slice(0, 10)
        if (campaign.starts_at > today) {
            throw new Error('Campaign has not started yet')
        }
        if (campaign.ends_at && campaign.ends_at < today) {
            throw new Error('Campaign has ended')
        }
        if (insertPayload['income_category'] !== 'DONATION') {
            throw new Error('Only DONATION category can be linked to a campaign')
        }

        // Generate contribution code via DB function (atomic, concurrency-safe)
        const { data: seqData, error: seqErr } = await (supabase as any).rpc('next_contribution_sequence', { p_rt_id: rtId })
        if (seqErr) throw seqErr

        const year   = new Date().getFullYear().toString().slice(-2)
        const code   = `${campaign.contribution_code_prefix}${year}-${seqData}`
        insertPayload['contribution_code'] = code
    }

    const row = await insertIncome(insertPayload)

    try {
        const { data: actor } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single()

        await supabase.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  (actor as any)?.name ?? null,
            action:      'CREATE_INCOME',
            entity_type: 'income_transactions',
            entity_id:   row.id,
            description: `Create income: ${row.income_name}`,
            visibility:  'internal',
            metadata: {
                income_category: row.income_category,
                amount:          row.amount,
            },
        })
    } catch {
        // activity log failure must not block the main flow
    }

    // Notify reviewer (Treasurer, or Chair if submitter is Treasurer) via API route
    fetch('/api/income/notify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ incomeId: row.id, rtId, incomeName: row.income_name ?? null, createdBy: userId }),
    }).catch(err => console.error('[Income Notify]', err))

    return row
}

export async function updateIncomeById(id: string, payload: Record<string, unknown>) {
    const { userId, rtId } = await getMembershipContext()

    const row = await updateIncome(id, { ...payload, updated_by: userId })

    try {
        const { data: actor } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single()

        await supabase.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  (actor as any)?.name ?? null,
            action:      'UPDATE_INCOME',
            entity_type: 'income_transactions',
            entity_id:   id,
            description: `Update income: ${row.income_name}`,
            visibility:  'internal',
        })
    } catch {
        // ignore
    }

    return row
}

export async function deleteIncomeById(id: string) {
    const { userId, rtId } = await getMembershipContext()

    await softDeleteIncome(id, userId)

    try {
        const { data: actor } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single()

        await supabase.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  (actor as any)?.name ?? null,
            action:      'DELETE_INCOME',
            entity_type: 'income_transactions',
            entity_id:   id,
            description: 'Delete income record',
            visibility:  'internal',
        })
    } catch {
        // ignore
    }
}
