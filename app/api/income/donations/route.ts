import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import {
    findDonationsPaginated,
    getDonationProgress,
} from '@/lib/repositories/incomeDonation.repository'

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

        const raw = await findDonationsPaginated(rtId, { page, pageSize, search, filters: { status } })

        const data = await Promise.all(
            raw.data.map(async (c: Record<string, unknown>) => {
                const progress = await getDonationProgress(c.id as string)
                return { ...c, ...progress }
            })
        )

        return NextResponse.json({ ...raw, data })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[donations GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_DONATION_CREATE)

        const rtId   = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId
        const body   = await req.json()

        const { name, donation_code, description, target_amount, starts_at, ends_at } = body

        if (!name || !donation_code) {
            return NextResponse.json({ error: 'name and donation_code are required' }, { status: 400 })
        }

        const code = String(donation_code).toUpperCase().replace(/\s+/g, '')
        if (code.length < 3 || code.length > 20) {
            return NextResponse.json({ error: 'donation_code must be 3-20 characters' }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabaseAdmin as any)
            .from('income_donations')
            .select('id')
            .eq('rt_id', rtId)
            .eq('donation_code', code)
            .limit(1)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Donation code already used in this RT' }, { status: 409 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation, error } = await (supabaseAdmin as any)
            .from('income_donations')
            .insert({
                rt_id:         rtId,
                name,
                donation_code: code,
                description:   description  || null,
                target_amount: target_amount ? Number(target_amount) : null,
                starts_at:     starts_at    || new Date().toISOString().slice(0, 10),
                ends_at:       ends_at      || null,
                status:        'DRAFT',
                created_by:    userId,
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
                action:      'donation_create',
                entity_type: 'donation',
                entity_id:   donation.id,
                description: `Donasi dibuat: ${name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        // Notify RT_CHAIR to review and activate the new donation
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: chairs } = await (supabaseAdmin as any)
                .from('memberships')
                .select('user_id')
                .eq('rt_id', rtId)
                .eq('role', 'CHAIR')
                .eq('status', 'active')

            if (chairs && chairs.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rows = (chairs as any[]).map((m: any) => ({
                    rt_id:          rtId,
                    type:           'donation_pending',
                    title:          'Kampanye Donasi Baru',
                    message:        `Kampanye "${name}" menunggu aktivasi Anda`,
                    entity_type:    'income_donations',
                    entity_id:      donation.id,
                    target_user_id: m.user_id,
                }))
                await supabaseAdmin.from('notifications').insert(rows)
            }
        } catch { /* non-critical */ }

        return NextResponse.json(donation, { status: 201 })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[donations POST]', err)
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }
}
