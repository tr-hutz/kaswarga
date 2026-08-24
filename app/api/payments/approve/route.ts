import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST(req: Request) {
    try {
        const { confirmationId } = await req.json()

        if (!confirmationId) {
            return NextResponse.json({ error: 'Missing confirmationId' }, { status: 400 })
        }

        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.PAYMENT_APPROVE)

        const rtId   = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const [
            { data: confirmation },
            { data: actor },
        ] = await Promise.all([
            supabaseAdmin
                .from('payment_confirmations')
                .select('resident_id, year, total_amount, confirmation_details(month)')
                .eq('id', confirmationId)
                .single(),
            supabaseAdmin.from('users').select('name').eq('id', userId).single(),
        ])

        const { error: rpcError } = await supabaseAdmin.rpc('approve_confirmation', {
            p_confirmation_id: confirmationId,
            p_user_id:         userId,
        })
        if (rpcError) throw rpcError

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'APPROVE_PAYMENT',
            entity_type: 'payment_confirmations',
            entity_id:   confirmationId,
            description: 'Approve payment confirmation',
            metadata:    {
                confirmationId,
                residentId:  confirmation?.resident_id,
                year:        confirmation?.year,
                totalAmount: confirmation?.total_amount,
                months:      confirmation?.confirmation_details?.map((d: { month: number }) => d.month) ?? [],
            },
        })

        // Notify the resident that their payment was approved
        try {
            if (confirmation?.resident_id) {
                const { data: membership } = await supabaseAdmin
                    .from('memberships')
                    .select('user_id')
                    .eq('resident_id', confirmation.resident_id)
                    .eq('rt_id', rtId)
                    .eq('status', 'active')
                    .maybeSingle()

                if (membership?.user_id) {
                    await supabaseAdmin.from('notifications').insert({
                        rt_id:          rtId,
                        type:           'payment_approved',
                        title:          'Pembayaran Disetujui',
                        message:        `Konfirmasi pembayaran iuran Anda untuk tahun ${confirmation.year} telah disetujui.`,
                        entity_type:    'payment_confirmations',
                        entity_id:      confirmationId,
                        target_user_id: membership.user_id,
                    })
                }
            }
        } catch { /* non-critical */ }

        return NextResponse.json({ success: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/approve]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
