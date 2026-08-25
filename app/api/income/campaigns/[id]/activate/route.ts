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
        requirePermission(ctx.authorization, PERMISSION.INCOME_CAMPAIGN_ACTIVATE)

        const { id } = await params
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaign, error: fetchError } = await (supabaseAdmin as any)
            .from('income_campaigns').select('id, rt_id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (fetchError) {
            console.error('[campaigns/activate] fetch error:', fetchError)
            throw fetchError
        }
        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        if (campaign.rt_id !== rtId) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
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

        // Notify RT_ADMIN and TREASURER that the campaign is now active
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: members } = await (supabaseAdmin as any)
                .from('memberships')
                .select('user_id')
                .eq('rt_id', rtId)
                .in('role', ['ADMIN', 'TREASURER'])
                .eq('status', 'active')

            if (members && members.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rows = (members as any[]).map((m: any) => ({
                    rt_id:          rtId,
                    type:           'campaign_activated',
                    title:          'Kampanye Aktif',
                    message:        `Kampanye "${campaign.name}" telah diaktifkan dan siap menerima donasi`,
                    entity_type:    'income_campaigns',
                    entity_id:      id,
                    target_user_id: m.user_id,
                }))
                await supabaseAdmin.from('notifications').insert(rows)
            }
        } catch { /* non-critical */ }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns/activate]', err)
        return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
    }
}
