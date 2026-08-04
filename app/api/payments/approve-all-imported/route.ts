/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/payments/approve-all-imported
|
| Approves all pending payment confirmations that were created via import
| (identified by proof_url ending in -import-confirm-payment.xlsx).
| Requires payment.approve permission.
|--------------------------------------------------------------------------
*/

export async function POST() {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.PAYMENT_APPROVE)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const { data: pending, error: fetchError } = await supabaseAdmin
            .from('payment_confirmations')
            .select('id')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .like('proof_url', '%-import-confirm-payment.xlsx')

        if (fetchError) throw fetchError
        if (!pending?.length) return NextResponse.json({ approved: 0 })

        let approved = 0
        for (const { id } of pending) {
            const { error } = await (supabaseAdmin as any).rpc('approve_confirmation', {
                p_confirmation_id: id,
                p_user_id:         userId,
            })
            if (!error) approved++
        }

        try {
            const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'APPROVE_ALL_IMPORTED_PAYMENTS',
                entity_type: 'payment_confirmations',
                entity_id:   null,
                description: `Setujui semua pembayaran impor (${approved} disetujui)`,
                metadata:    { approved },
            })
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ approved })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/approve-all-imported]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve all' }, { status: 500 })
    }
}
