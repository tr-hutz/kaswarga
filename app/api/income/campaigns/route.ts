import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import {
    findCampaignsPaginated,
    getCampaignProgress,
} from '@/lib/repositories/incomeCampaign.repository'

export async function GET(req: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_VIEW)

        const rtId = ctx.authorization.neighborhoodId
        const url  = new URL(req.url)
        const page     = Number(url.searchParams.get('page')     ?? 1)
        const pageSize = Number(url.searchParams.get('pageSize') ?? 10)
        const search   = url.searchParams.get('search') ?? ''
        const status   = url.searchParams.get('status') ?? 'all'

        const raw = await findCampaignsPaginated(rtId, { page, pageSize, search, filters: { status } })

        const data = await Promise.all(
            raw.data.map(async (c: Record<string, unknown>) => {
                const progress = await getCampaignProgress(c.id as string)
                return { ...c, ...progress }
            })
        )

        return NextResponse.json({ ...raw, data })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_CAMPAIGN_CREATE)

        const rtId   = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId
        const body   = await req.json()

        const { name, contribution_code_prefix, description, target_amount, starts_at, ends_at } = body

        if (!name || !contribution_code_prefix) {
            return NextResponse.json({ error: 'name and contribution_code_prefix are required' }, { status: 400 })
        }

        const prefix = String(contribution_code_prefix).toUpperCase()
        if (!/^[A-Z]{2,4}$/.test(prefix)) {
            return NextResponse.json({ error: 'contribution_code_prefix must be 2-4 uppercase letters' }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabaseAdmin as any)
            .from('income_campaigns')
            .select('id')
            .eq('rt_id', rtId)
            .eq('contribution_code_prefix', prefix)
            .limit(1)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Contribution code prefix already used in this RT' }, { status: 409 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaign, error } = await (supabaseAdmin as any)
            .from('income_campaigns')
            .insert({
                rt_id:                    rtId,
                name,
                contribution_code_prefix: prefix,
                description:              description  || null,
                target_amount:            target_amount ? Number(target_amount) : null,
                starts_at:                starts_at    || new Date().toISOString().slice(0, 10),
                ends_at:                  ends_at      || null,
                status:                   'DRAFT',
                created_by:               userId,
            })
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
                action:      'campaign_create',
                entity_type: 'campaign',
                entity_id:   campaign.id,
                description: `Kampanye dibuat: ${name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json(campaign, { status: 201 })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[campaigns POST]', err)
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }
}
