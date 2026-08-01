import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST(req: Request) {
    try {
        const { confirmationId, reason } = await req.json()

        if (!confirmationId) {
            return NextResponse.json({ error: 'Missing confirmationId' }, { status: 400 })
        }

        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.PAYMENT_REJECT)

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

        const { error: rpcError } = await supabaseAdmin.rpc('reject_confirmation', {
            p_confirmation_id: confirmationId,
            p_reason:          reason ?? '',
            p_user_id:         userId,
        })
        if (rpcError) throw rpcError

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'REJECT_PAYMENT',
            entity_type: 'payment_confirmations',
            entity_id:   confirmationId,
            description: `Reject payment confirmation${reason ? `: ${reason}` : ''}`,
            metadata:    {
                confirmationId,
                residentId:  confirmation?.resident_id,
                year:        confirmation?.year,
                totalAmount: confirmation?.total_amount,
                months:      confirmation?.confirmation_details?.map((d: { month: number }) => d.month) ?? [],
                reason:      reason ?? null,
            },
        })

        return NextResponse.json({ success: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/reject]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
