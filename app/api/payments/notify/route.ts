/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'

const db = supabaseAdmin as any

export async function POST(req: Request) {
    try {
        await getRequestContext()

        const { confirmationId } = await req.json()
        if (!confirmationId) return NextResponse.json({ ok: true })

        const { data: confirmation } = await supabaseAdmin
            .from('payment_confirmations')
            .select('rt_id, year')
            .eq('id', confirmationId)
            .single()

        if (!confirmation) return NextResponse.json({ ok: true })

        const { count: monthCount } = await db
            .from('confirmation_details')
            .select('*', { count: 'exact', head: true })
            .eq('confirmation_id', confirmationId)

        const { data: treasurers } = await db
            .from('memberships')
            .select('user_id')
            .eq('rt_id', confirmation.rt_id)
            .eq('role', 'TREASURER')
            .eq('status', 'active')

        if (!treasurers?.length) return NextResponse.json({ ok: true })

        const months = monthCount ?? 0
        await db.from('notifications').insert(
            treasurers.map((t: { user_id: string }) => ({
                rt_id:          confirmation.rt_id,
                type:           'payment_pending',
                title:          'New Payment Submission',
                message:        `A resident submitted a payment confirmation for ${confirmation.year} (${months} month${months !== 1 ? 's' : ''})`,
                entity_type:    'payment_confirmations',
                entity_id:      confirmationId,
                target_user_id: t.user_id,
            }))
        )

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[payments/notify]', err)
        return NextResponse.json({ ok: true })
    }
}
