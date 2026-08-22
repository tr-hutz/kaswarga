import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import {
    findCampaignById,
    getCampaignProgress,
    countCampaignContributions,
    findCampaignContributions,
} from '@/lib/repositories/incomeCampaign.repository'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_VIEW)

        const { id } = await params
        const campaign = await findCampaignById(id)
        if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const [progress, contributions] = await Promise.all([
            getCampaignProgress(id),
            findCampaignContributions(id),
        ])

        return NextResponse.json({ ...campaign, ...progress, ...contributions })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns/[id] GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: Params) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_CAMPAIGN_UPDATE)

        const { id }   = await params
        const userId   = ctx.authorization.userId
        const rtId     = ctx.authorization.neighborhoodId
        const body     = await req.json()

        const campaign = await findCampaignById(id)
        if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!['DRAFT', 'ACTIVE'].includes(campaign.status)) {
            return NextResponse.json({ error: 'Only DRAFT or ACTIVE campaigns can be updated' }, { status: 409 })
        }

        const { name, description, target_amount, starts_at, ends_at } = body

        // If trying to update prefix, check no contributions exist
        if (body.contribution_code_prefix !== undefined) {
            const count = await countCampaignContributions(id)
            if (count > 0) {
                return NextResponse.json({ error: 'Cannot change prefix after contributions exist' }, { status: 409 })
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error } = await (supabaseAdmin as any)
            .from('income_campaigns')
            .update({
                ...(name          !== undefined && { name }),
                ...(description   !== undefined && { description: description || null }),
                ...(target_amount !== undefined && { target_amount: target_amount ? Number(target_amount) : null }),
                ...(starts_at     !== undefined && { starts_at }),
                ...(ends_at       !== undefined && { ends_at: ends_at || null }),
                updated_by: userId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: actor } = await (supabaseAdmin as any).from('users').select('name').eq('id', userId).single()
            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'campaign_update',
                entity_type: 'campaign',
                entity_id:   id,
                description: `Kampanye diperbarui: ${updated.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json(updated)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns/[id] PUT]', err)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_CAMPAIGN_DELETE)

        const { id }   = await params
        const userId   = ctx.authorization.userId
        const rtId     = ctx.authorization.neighborhoodId

        const campaign = await findCampaignById(id)
        if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!['DRAFT', 'CANCELLED'].includes(campaign.status)) {
            return NextResponse.json({ error: 'Only DRAFT or CANCELLED campaigns can be deleted' }, { status: 409 })
        }

        const count = await countCampaignContributions(id)
        if (count > 0) {
            return NextResponse.json({ error: 'Cannot delete campaign with existing contributions' }, { status: 409 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('income_campaigns')
            .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: actor } = await (supabaseAdmin as any).from('users').select('name').eq('id', userId).single()
            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'campaign_delete',
                entity_type: 'campaign',
                entity_id:   id,
                description: `Kampanye dihapus: ${campaign.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns/[id] DELETE]', err)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
