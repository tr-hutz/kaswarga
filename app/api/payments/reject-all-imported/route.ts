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

        // Re-fetch with resident_id + year so we can notify residents
        const { data: pendingFull } = await (supabaseAdmin as any)
            .from('payment_confirmations')
            .select('id, resident_id, year')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .like('proof_url', '%-import-confirm-payment.xlsx')

        let rejected = 0
        const rejectedConfirmations: Array<{ id: string; resident_id: string; year: number }> = []
        for (const row of (pendingFull ?? [])) {
            const { error } = await (supabaseAdmin as any).rpc('reject_confirmation', {
                p_confirmation_id: row.id,
                p_reason:          reason.trim(),
                p_user_id:         userId,
            })
            if (!error) {
                rejected++
                if (row.resident_id) rejectedConfirmations.push(row)
            }
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

            // Notify each affected resident (batch lookup + insert)
            if (rejectedConfirmations.length > 0) {
                const residentIds = [...new Set(rejectedConfirmations.map(c => c.resident_id))]
                const { data: memberships } = await (supabaseAdmin as any)
                    .from('memberships')
                    .select('resident_id, user_id')
                    .eq('rt_id', rtId)
                    .eq('status', 'active')
                    .in('resident_id', residentIds)

                const residentUserMap: Record<string, string> = {}
                for (const m of (memberships ?? [])) residentUserMap[m.resident_id] = m.user_id

                const notifs = rejectedConfirmations
                    .filter(c => residentUserMap[c.resident_id])
                    .map(c => ({
                        rt_id:          rtId,
                        type:           'payment_rejected',
                        title:          'Pembayaran Ditolak',
                        message:        `Konfirmasi pembayaran iuran Anda untuk tahun ${c.year} ditolak${reason ? `: ${reason}` : ''}.`,
                        entity_type:    'payment_confirmations',
                        entity_id:      c.id,
                        target_user_id: residentUserMap[c.resident_id],
                    }))

                if (notifs.length) await (supabaseAdmin as any).from('notifications').insert(notifs)
            }
        } catch {
            // Activity log / notification errors must not block the main flow
        }

        return NextResponse.json({ rejected })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/reject-all-imported]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to reject all' }, { status: 500 })
    }
}
