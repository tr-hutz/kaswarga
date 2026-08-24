import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
    try {
        const ctx    = await getRequestContext()
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId

        const { id } = await params

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaign } = await (supabaseAdmin as any)
            .from('income_campaigns')
            .select('id, name, status, rt_id, contribution_code_prefix, starts_at, ends_at')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle()

        if (!campaign || campaign.rt_id !== rtId) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
        if (campaign.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Campaign is not active' }, { status: 409 })
        }

        const today = new Date().toISOString().slice(0, 10)
        if (campaign.starts_at > today) {
            return NextResponse.json({ error: 'Campaign has not started yet' }, { status: 409 })
        }
        if (campaign.ends_at && campaign.ends_at < today) {
            return NextResponse.json({ error: 'Campaign has ended' }, { status: 409 })
        }

        const body = await req.json()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: seqData, error: seqErr } = await (supabaseAdmin as any)
            .rpc('next_contribution_sequence', { p_rt_id: rtId })
        if (seqErr) throw seqErr

        const year              = new Date().getFullYear().toString().slice(-2)
        const contribution_code = `${campaign.contribution_code_prefix}${year}-${seqData}`

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: row, error } = await (supabaseAdmin as any)
            .from('income_transactions')
            .insert({
                rt_id:            rtId,
                campaign_id:      id,
                income_name:      body.income_name      ?? campaign.name,
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
        fetch('/api/income/notify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ incomeId: row.id, rtId, incomeName: row.income_name ?? null, createdBy: userId }),
        }).catch(err => console.error('[campaign/donate notify]', err))

        return NextResponse.json(row, { status: 201 })

    } catch (err) {
        if (err instanceof UnauthorizedError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('[campaign/donate]', err)
        return NextResponse.json({ error: 'Failed to donate' }, { status: 500 })
    }
}
