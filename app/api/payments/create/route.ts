import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/payments/create
|
| Treasurer manually records a payment for a resident.
| Creates a payment_confirmation + confirmation_details then immediately
| calls approve_confirmation so the payment lands in the ledger.
|
| The amount per month MUST match the RT's monthly_fee because
| approve_confirmation validates: total_amount == monthly_fee × month_count.
| We fetch monthly_fee server-side to guarantee this constraint is met.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.PAYMENT_CREATE)

        const rtId   = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const body = await req.json() as {
            residentId: string
            year:       number
            months:     number[]
            method?:    string | null
            notes?:     string | null
            date?:      string
        }

        const { residentId, year, months } = body

        if (!residentId || !year || !months?.length) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!months.every(m => m >= 1 && m <= 12)) {
            return NextResponse.json({ error: 'Invalid month value' }, { status: 400 })
        }

        // Fetch RT monthly_fee — must match approve_confirmation's validation
        const { data: rtRow, error: rtError } = await supabaseAdmin
            .from('rt')
            .select('monthly_fee, name')
            .eq('id', rtId)
            .single()

        if (rtError || !rtRow) throw rtError ?? new Error('RT not found')

        const monthlyFee = rtRow.monthly_fee as number | null
        if (!monthlyFee || monthlyFee <= 0) {
            return NextResponse.json(
                { error: 'Nominal iuran RT belum dikonfigurasi. Silakan set monthly_fee di pengaturan RT.' },
                { status: 422 }
            )
        }

        const totalAmount = months.length * monthlyFee

        // Check for already-existing entries
        const { data: existingDetails } = await supabaseAdmin
            .from('confirmation_details')
            .select('month')
            .eq('resident_id', residentId)
            .eq('year', year)
            .in('month', months)

        const alreadyPaid = (existingDetails ?? []).map((d: { month: number }) => d.month)
        if (alreadyPaid.length > 0) {
            return NextResponse.json(
                { error: `Bulan sudah tercatat: ${alreadyPaid.join(', ')}` },
                { status: 409 }
            )
        }

        const { data: actor } = await supabaseAdmin
            .from('users').select('name').eq('id', userId).single()

        // Create payment_confirmation
        const { data: confirmation, error: confirmError } = await supabaseAdmin
            .from('payment_confirmations')
            .insert({
                resident_id:  residentId,
                rt_id:        rtId,
                year,
                total_amount: totalAmount,
                status:       'pending',
                proof_url:    null,
            })
            .select('id')
            .single()

        if (confirmError || !confirmation) throw confirmError ?? new Error('Insert confirmation failed')

        // Create confirmation_details — amount per month MUST equal monthly_fee
        const details = months.map(month => ({
            confirmation_id: confirmation.id,
            resident_id:     residentId,
            year,
            month,
            amount:          monthlyFee,
        }))

        const { error: detailsError } = await supabaseAdmin
            .from('confirmation_details')
            .insert(details)

        if (detailsError) throw detailsError

        // Auto-approve: creates payments + payment_details + ledger entry
        const { error: rpcError } = await supabaseAdmin.rpc('approve_confirmation', {
            p_confirmation_id: confirmation.id,
            p_user_id:         userId,
        })
        if (rpcError) throw rpcError

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'CREATE_PAYMENT',
            entity_type: 'payment_confirmations',
            entity_id:   confirmation.id,
            description: `Catat pembayaran manual untuk ${months.length} bulan tahun ${year}`,
            metadata:    { residentId, year, months, totalAmount },
        })

        // Notify resident that their payment was recorded and approved
        try {
            const { data: membership } = await supabaseAdmin
                .from('memberships')
                .select('user_id')
                .eq('resident_id', residentId)
                .eq('rt_id', rtId)
                .eq('status', 'active')
                .maybeSingle()

            if (membership?.user_id) {
                await supabaseAdmin.from('notifications').insert({
                    rt_id:          rtId,
                    type:           'payment_approved',
                    title:          'Pembayaran Dicatat',
                    message:        `Pembayaran iuran Anda untuk ${months.length} bulan tahun ${year} telah dicatat dan disetujui.`,
                    entity_type:    'payment_confirmations',
                    entity_id:      confirmation.id,
                    target_user_id: membership.user_id,
                })
            }
        } catch { /* non-critical */ }

        return NextResponse.json({ success: true, confirmationId: confirmation.id })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/create]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
