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
        requirePermission(ctx.authorization, PERMISSION.INCOME_CAMPAIGN_ACTIVATE)

        const { id } = await params
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId
        const body   = await req.json().catch(() => ({}))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaign, error: fetchError } = await (supabaseAdmin as any)
            .from('income_campaigns').select('id, rt_id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (fetchError) {
            console.error('[campaigns/cancel] fetch error:', fetchError)
            throw fetchError
        }
        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        if (campaign.rt_id !== rtId) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        if (!['DRAFT', 'ACTIVE'].includes(campaign.status)) {
            return NextResponse.json({ error: 'Only DRAFT or ACTIVE campaigns can be cancelled' }, { status: 409 })
        }

        const now = new Date().toISOString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('income_campaigns')
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
                action:      'campaign_cancel',
                entity_type: 'campaign',
                entity_id:   id,
                description: `Kampanye dibatalkan: ${campaign.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns/cancel]', err)
        return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
    }
}
