/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase }              from '../supabase'
import { getCurrentMembership }  from '../auth/getCurrentMembership'
import {
    insertIncome,
    updateIncome,
    softDeleteIncome,
} from '../repositories/income.repository'

async function getMembershipContext() {
    const membership = await getCurrentMembership()
    return {
        userId: (membership as any)?.user?.id as string,
        rtId:   (membership as any)?.rt?.id   as string,
    }
}

export async function createIncome(payload: Record<string, unknown>) {
    const { userId, rtId } = await getMembershipContext()

    const row = await insertIncome({
        ...payload,
        rt_id:      rtId,
        created_by: userId,
        status:     'pending',
    })

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

    try {
        const { data: chairs } = await supabase
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairs?.length) {
            await supabase.from('notifications').insert(
                (chairs as any[]).map(m => ({
                    rt_id:          rtId,
                    type:           'income_pending',
                    title:          'Pemasukan Baru Menunggu Persetujuan',
                    message:        `Pemasukan "${row.income_name}" telah dicatat dan menunggu persetujuan Anda.`,
                    entity_type:    'income_transactions',
                    entity_id:      row.id,
                    target_user_id: m.user_id,
                }))
            )
        }
    } catch {
        // notification failure must not block the main flow
    }

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
