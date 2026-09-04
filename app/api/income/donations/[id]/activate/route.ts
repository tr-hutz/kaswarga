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
        requirePermission(ctx.authorization, PERMISSION.INCOME_DONATION_ACTIVATE)

        const { id } = await params
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: donation, error: fetchError } = await (supabaseAdmin as any)
            .from('income_donations').select('id, rt_id, name, status').eq('id', id).is('deleted_at', null).maybeSingle()
        if (fetchError) {
            console.error('[donations/activate] fetch error:', fetchError)
            throw fetchError
        }
        if (!donation) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
        if (donation.rt_id !== rtId) return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
        if (donation.status !== 'DRAFT') {
            return NextResponse.json({ error: 'Only DRAFT donations can be activated' }, { status: 409 })
        }

        const now = new Date().toISOString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('income_donations')
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
                action:      'donation_activate',
                entity_type: 'donation',
                entity_id:   id,
                description: `Donasi diaktifkan: ${donation.name}`,
                visibility:  'internal',
            })
        } catch { /* non-critical */ }

        // Notify RT_ADMIN and TREASURER that the donation is now active
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
                    type:           'donation_activated',
                    title:          'Kampanye Aktif',
                    message:        `Kampanye "${donation.name}" telah diaktifkan dan siap menerima donasi`,
                    entity_type:    'income_donations',
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
        console.error('[donations/activate]', err)
        return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
    }
}
