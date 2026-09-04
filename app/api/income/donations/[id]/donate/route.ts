import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { notifyIncomeReviewer } from '@/lib/services/incomeNotification.server'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
    try {
        const ctx    = await getRequestContext()
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId

        const { id } = await params

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation } = await (supabaseAdmin as any)
            .from('income_donations')
            .select('id, name, status, rt_id, donation_code, starts_at, ends_at')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle()

        if (!donation || donation.rt_id !== rtId) {
            return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
        }
        if (donation.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Donation is not active' }, { status: 409 })
        }

        const today = new Date().toISOString().slice(0, 10)
        if (donation.starts_at > today) {
            return NextResponse.json({ error: 'Donation has not started yet' }, { status: 409 })
        }
        if (donation.ends_at && donation.ends_at < today) {
            return NextResponse.json({ error: 'Donation has ended' }, { status: 409 })
        }

        const body = await req.json()

        const contribution_code = donation.donation_code as string

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: row, error } = await (supabaseAdmin as any)
            .from('income_transactions')
            .insert({
                rt_id:            rtId,
                donation_id:      id,
                income_name:      body.income_name      ?? donation.name,
                income_category:  'DONATION',
                source_type:      body.source_type      ?? 'ANONYMOUS',
                resident_id:      body.resident_id      || null,
                payer_name:       body.payer_name        || null,
                is_anonymous:     body.source_type === 'ANONYMOUS',
                payment_method:   body.payment_method   || null,
                reference_number: body.reference_number || null,
                amount:           Number(body.amount),
                received_at:      body.received_at,
                notes:            body.notes             || null,
                status:           'pending',
                contribution_code,
                created_by:       userId,
            })
            .select()
            .single()

        if (error) throw error

        // Fire-and-forget: notify reviewer (Treasurer, or Chair if submitter is Treasurer)
        notifyIncomeReviewer({ incomeId: row.id, rtId, incomeName: row.income_name ?? null, createdBy: userId })
            .catch(err => console.error('[donation/donate notify]', err))

        return NextResponse.json(row, { status: 201 })

    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[donation/donate]', err)
        return NextResponse.json({ error: 'Failed to donate' }, { status: 500 })
    }
}
