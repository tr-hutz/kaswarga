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

        // Re-fetch with resident_id + year so we can notify residents
        const { data: pendingFull } = await (supabaseAdmin as any)
            .from('payment_confirmations')
            .select('id, resident_id, year')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .like('proof_url', '%-import-confirm-payment.xlsx')

        let approved = 0
        const approvedConfirmations: Array<{ id: string; resident_id: string; year: number }> = []
        for (const row of (pendingFull ?? [])) {
            const { error } = await (supabaseAdmin as any).rpc('approve_confirmation', {
                p_confirmation_id: row.id,
                p_user_id:         userId,
            })
            if (!error) {
                approved++
                if (row.resident_id) approvedConfirmations.push(row)
            }
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

            // Notify each affected resident (batch lookup + insert)
            if (approvedConfirmations.length > 0) {
                const residentIds = [...new Set(approvedConfirmations.map(c => c.resident_id))]
                const { data: memberships } = await (supabaseAdmin as any)
                    .from('memberships')
                    .select('resident_id, user_id')
                    .eq('rt_id', rtId)
                    .eq('status', 'active')
                    .in('resident_id', residentIds)

                const residentUserMap: Record<string, string> = {}
                for (const m of (memberships ?? [])) residentUserMap[m.resident_id] = m.user_id

                const notifs = approvedConfirmations
                    .filter(c => residentUserMap[c.resident_id])
                    .map(c => ({
                        rt_id:          rtId,
                        type:           'payment_approved',
                        title:          'Pembayaran Disetujui',
                        message:        `Konfirmasi pembayaran iuran Anda untuk tahun ${c.year} telah disetujui.`,
                        entity_type:    'payment_confirmations',
                        entity_id:      c.id,
                        target_user_id: residentUserMap[c.resident_id],
                    }))

                if (notifs.length) await (supabaseAdmin as any).from('notifications').insert(notifs)
            }
        } catch {
            // Activity log / notification errors must not block the main flow
        }

        return NextResponse.json({ approved })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/approve-all-imported]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve all' }, { status: 500 })
    }
}
