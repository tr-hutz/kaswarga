import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_CAMPAIGN_UPDATE)

        const { id } = await params
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaign } = await (supabaseAdmin as any)
            .from('income_campaigns').select('id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (campaign.status !== 'DRAFT') {
            return NextResponse.json({ error: 'Only DRAFT campaigns can be activated' }, { status: 409 })
        }

        const now = new Date().toISOString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('income_campaigns')
            .update({ status: 'ACTIVE', updated_by: userId, updated_at: now })
            .eq('id', id)

        if (error) throw error

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: actor } = await (supabaseAdmin as any).from('users').select('name').eq('id', userId).single()
            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'campaign_activate',
                entity_type: 'campaign',
                entity_id:   id,
                description: `Kampanye diaktifkan: ${campaign.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns/activate]', err)
        return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
    }
}
