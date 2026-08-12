/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST() {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.EXPENSE_APPROVE)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        // Snapshot pending expenses before approval so we can send per-creator summary notifications
        const { data: pendingExpenses } = await (supabaseAdmin as any)
            .from('expenses')
            .select('created_by')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .eq('active', true)

        const byCreator = new Map<string, number>()
        for (const e of (pendingExpenses ?? []) as Array<{ created_by: string | null }>) {
            if (e.created_by) byCreator.set(e.created_by, (byCreator.get(e.created_by) ?? 0) + 1)
        }

        const { data, error } = await (supabaseAdmin as any).rpc('approve_all_pending_expenses', {
            p_rt_id:   rtId,
            p_user_id: userId,
        })

        if (error) throw error

        try {
            const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'APPROVE_ALL_EXPENSES',
                entity_type: 'expenses',
                entity_id:   null,
                description: `Approve all pending expenses (${data ?? 0} approved)`,
                metadata:    { approvedCount: data ?? 0 }
            })

            // One summary notification per creator instead of N individual ones
            if (byCreator.size > 0 && (data ?? 0) > 0) {
                await (supabaseAdmin as any).from('notifications').insert(
                    [...byCreator.entries()].map(([creatorId, count]) => ({
                        rt_id:          rtId,
                        type:           'expense_approved',
                        title:          'Pengeluaran Disetujui',
                        message:        `${count} pengeluaran Anda telah disetujui`,
                        entity_type:    'expenses',
                        entity_id:      rtId,
                        target_user_id: creatorId,
                    }))
                )
            }
        } catch {
            // Activity log / notification errors must not block the main flow
        }

        return NextResponse.json({ approved: data })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[expenses/approve-all]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve all' }, { status: 500 })
    }
}
