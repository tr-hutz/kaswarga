import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_DONATION_ACTIVATE)

        const { id } = await params
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId
        const body   = await req.json().catch(() => ({}))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation, error: fetchError } = await (supabaseAdmin as any)
            .from('income_donations').select('id, rt_id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (fetchError) {
            console.error('[donations/cancel] fetch error:', fetchError)
            throw fetchError
        }
        if (!donation) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
        if (donation.rt_id !== rtId) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
        if (!['DRAFT', 'ACTIVE'].includes(donation.status)) {
            return NextResponse.json({ error: 'Only DRAFT or ACTIVE donations can be cancelled' }, { status: 409 })
        }

        const now = new Date().toISOString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('income_donations')
            .update({
                status:         'CANCELLED',
                cancelled_note: body.cancelled_note || null,
                updated_by:     userId,
                updated_at:     now,
            })
            .eq('id', id)

        if (error) throw error

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: actor } = await (supabaseAdmin as any).from('users').select('name').eq('id', userId).single()
            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'donation_cancel',
                entity_type: 'donation',
                entity_id:   id,
                description: `Donasi dibatalkan: ${donation.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[donations/cancel]', err)
        return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
    }
}
