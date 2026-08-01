/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.PAYMENT_REJECT)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const { reason } = await req.json() as { reason: string }
        if (!reason?.trim()) {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
        }

        const { data: pending, error: fetchError } = await supabaseAdmin
            .from('payment_confirmations')
            .select('id')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .like('proof_url', '%-import-confirm-payment.xlsx')

        if (fetchError) throw fetchError
        if (!pending?.length) return NextResponse.json({ rejected: 0 })

        let rejected = 0
        for (const { id } of pending) {
            const { error } = await (supabaseAdmin as any).rpc('reject_confirmation', {
                p_confirmation_id: id,
                p_reason:          reason.trim(),
                p_user_id:         userId,
            })
            if (!error) rejected++
        }

        try {
            const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'REJECT_ALL_IMPORTED_PAYMENTS',
                entity_type: 'payment_confirmations',
                entity_id:   null,
                description: `Tolak semua pembayaran impor (${rejected} ditolak)`,
                metadata:    { rejected, reason },
            })
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ rejected })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/reject-all-imported]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to reject all' }, { status: 500 })
    }
}
