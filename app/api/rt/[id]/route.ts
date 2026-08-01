import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| DELETE /api/rt/[id]
|
| Soft-deletes an RT and deactivates all its members.
| Requires rt.delete permission (SUPER_ADMIN only via BR-128).
|--------------------------------------------------------------------------
*/

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json({ error: 'Missing RT id' }, { status: 400 })
        }

        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.RT_DELETE)

        const userId = ctx.authorization.userId

        // Fetch RT name for the activity log
        const { data: rt, error: rtError } = await supabaseAdmin
            .from('rt')
            .select('name, code')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle()

        if (rtError || !rt) {
            return NextResponse.json({ error: 'RT not found' }, { status: 404 })
        }

        // Soft-delete the RT
        const { error: deleteError } = await supabaseAdmin
            .from('rt')
            .update({ deleted_at: new Date().toISOString(), active: false, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (deleteError) throw deleteError

        // Deactivate all memberships for this RT
        const { error: membershipUpdateError } = await supabaseAdmin
            .from('memberships')
            .update({ status: 'deactivated' })
            .eq('rt_id', id)

        if (membershipUpdateError) throw membershipUpdateError

        const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       SYSTEM_RT_ID,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'DELETE_RT',
            entity_type: 'rt',
            entity_id:   id,
            description: `Deleted RT: ${rt.name}`,
            metadata:    { name: rt.name, code: rt.code }
        })

        return NextResponse.json({ success: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[DELETE /api/rt/[id]]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
