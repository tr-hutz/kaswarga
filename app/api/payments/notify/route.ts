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
            .select('rt_id, year, resident_id')
            .eq('id', confirmationId)
            .single()

        if (!confirmation) return NextResponse.json({ ok: true })

        const { count: monthCount } = await db
            .from('confirmation_details')
            .select('*', { count: 'exact', head: true })
            .eq('confirmation_id', confirmationId)

        // Maker-checker: if submitting resident has TREASURER role, escalate to Chair
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rt } = await (supabaseAdmin as any)
            .from('rt').select('maker_checker_enabled').eq('id', confirmation.rt_id).single()
        const makerCheckerEnabled = rt?.maker_checker_enabled ?? true

        let submitterIsTreasurer = false
        if (makerCheckerEnabled && confirmation.resident_id) {
            const { data: submitterMembership } = await db
                .from('memberships')
                .select('role')
                .eq('resident_id', confirmation.resident_id)
                .eq('rt_id', confirmation.rt_id)
                .eq('status', 'active')
                .maybeSingle()
            submitterIsTreasurer = submitterMembership?.role === 'TREASURER'
        }

        const targetRole = (makerCheckerEnabled && submitterIsTreasurer) ? 'CHAIR' : 'TREASURER'

        const { data: reviewers } = await db
            .from('memberships')
            .select('user_id')
            .eq('rt_id', confirmation.rt_id)
            .eq('role', targetRole)
            .eq('status', 'active')

        if (!reviewers?.length) return NextResponse.json({ ok: true })

        const months = monthCount ?? 0
        await db.from('notifications').insert(
            reviewers.map((t: { user_id: string }) => ({
                rt_id:          confirmation.rt_id,
                type:           'payment_pending',
                title:          'Konfirmasi Pembayaran Baru',
                message:        `Warga mengajukan konfirmasi pembayaran iuran ${confirmation.year} (${months} bulan)`,
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
