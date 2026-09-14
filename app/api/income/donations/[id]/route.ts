import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import {
    getDonationProgress,
    countDonationContributions,
    findDonationContributions,
} from '@/lib/repositories/incomeDonation.repository'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_VIEW)

        const { id } = await params
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation } = await (supabaseAdmin as any)
            .from('income_donations').select('id,rt_id,name,donation_code,description,target_amount,starts_at,ends_at,status,cancelled_note,created_by,updated_by,created_at,updated_at').eq('id', id).is('deleted_at', null).maybeSingle()
        if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const [progress, contributions] = await Promise.all([
            getDonationProgress(id),
            findDonationContributions(id),
        ])

        return NextResponse.json({ ...donation, ...progress, ...contributions })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[donations/[id] GET]', err)
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: Params) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_DONATION_UPDATE)

        const { id }   = await params
        const userId   = ctx.authorization.userId
        const rtId     = ctx.authorization.neighborhoodId
        const body     = await req.json()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation } = await (supabaseAdmin as any)
            .from('income_donations').select('id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!['DRAFT', 'ACTIVE'].includes(donation.status)) {
            return NextResponse.json({ error: 'Only DRAFT or ACTIVE donations can be updated' }, { status: 409 })
        }

        const { name, description, target_amount, starts_at, ends_at } = body

        // If trying to update prefix, check no contributions exist
        if (body.donation_code !== undefined) {
            const count = await countDonationContributions(id)
            if (count > 0) {
                return NextResponse.json({ error: 'Cannot change prefix after contributions exist' }, { status: 409 })
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error } = await (supabaseAdmin as any)
            .from('income_donations')
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
                action:      'donation_update',
                entity_type: 'donation',
                entity_id:   id,
                description: `Donasi diperbarui: ${updated.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json(updated)

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[donations/[id] PUT]', err)
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    try {
        const ctx = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_DONATION_DELETE)

        const { id }   = await params
        const userId   = ctx.authorization.userId
        const rtId     = ctx.authorization.neighborhoodId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation } = await (supabaseAdmin as any)
            .from('income_donations').select('id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (!['DRAFT', 'CANCELLED'].includes(donation.status)) {
            return NextResponse.json({ error: 'Only DRAFT or CANCELLED donations can be deleted' }, { status: 409 })
        }

        const count = await countDonationContributions(id)
        if (count > 0) {
            return NextResponse.json({ error: 'Cannot delete donation with existing contributions' }, { status: 409 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('income_donations')
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
                action:      'donation_delete',
                entity_type: 'donation',
                entity_id:   id,
                description: `Donasi dihapus: ${donation.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[donations/[id] DELETE]', err)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
