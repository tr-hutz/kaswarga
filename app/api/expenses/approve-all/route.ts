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
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ approved: data })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[expenses/approve-all]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve all' }, { status: 500 })
    }
}
