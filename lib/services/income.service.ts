/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase }              from '@/lib/supabase'
import { getCurrentMembership }  from '@/lib/auth/getCurrentMembership'
import {
    insertIncome,
    updateIncome,
    softDeleteIncome,
} from '@/lib/repositories/income.repository'
import { findDonationById } from '@/lib/repositories/incomeDonation.repository'

async function getMembershipContext() {
    const membership = await getCurrentMembership()
    return {
        userId: membership?.user?.id as string,
        rtId:   membership?.rt?.id   as string,
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

    // Donation validation + contribution code generation
    if (insertPayload['donation_id']) {
        const donationId = insertPayload['donation_id'] as string
        const donation   = await findDonationById(donationId)

        if (!donation || donation.rt_id !== rtId) {
            throw new Error('Donation not found')
        }
        if (donation.status !== 'ACTIVE') {
            throw new Error('Donation is not active')
        }

        const today = new Date().toISOString().slice(0, 10)
        if (donation.starts_at > today) {
            throw new Error('Donation has not started yet')
        }
        if (donation.ends_at && donation.ends_at < today) {
            throw new Error('Donation has ended')
        }
        if (insertPayload['income_category'] !== 'DONATION') {
            throw new Error('Only DONATION category can be linked to a donation')
        }

        insertPayload['contribution_code'] = donation.donation_code
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
