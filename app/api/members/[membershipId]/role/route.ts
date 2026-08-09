import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { changeMemberRole }  from '@/lib/services/member-override.service'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

type Params = { params: Promise<{ membershipId: string }> }

/*
|--------------------------------------------------------------------------
| PATCH /api/members/[membershipId]/role
|
| Body: { role: string }  — DB enum value: ADMIN | CHAIR | TREASURER | SECRETARY | RESIDENT
|--------------------------------------------------------------------------
*/

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { membershipId } = await params
        if (!membershipId) return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 })

        const ctx  = await getRequestContext()
        const body = await req.json() as { role?: unknown }

        if (typeof body.role !== 'string' || !body.role.trim()) {
            return NextResponse.json({ error: 'role must be a non-empty string' }, { status: 400 })
        }

        const result = await changeMemberRole(membershipId, body.role.trim(), ctx.authorization)

        if (result) {
            const { oldRole, newRole, memberName } = result
            const rtId   = ctx.authorization.neighborhoodId
            const userId = ctx.authorization.userId

            const { data: actor } = await supabaseAdmin
                .from('users')
                .select('name')
                .eq('id', userId)
                .single()

            // fire-and-forget — do not await so a log failure never blocks the response
            supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'CHANGE_MEMBER_ROLE',
                entity_type: 'memberships',
                entity_id:   membershipId,
                description: `Changed role of ${memberName ?? membershipId} from ${oldRole} to ${newRole}`,
                metadata:    { membershipId, memberName, oldRole, newRole },
            }).then(({ error }) => {
                if (error) console.error('[PATCH role] activity log failed', error)
            })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        if ((err as Error).message === 'LAST_ADMIN_DEMOTION') {
            return NextResponse.json(
                { error: 'RT harus memiliki minimal satu Administrator' },
                { status: 422 },
            )
        }
        console.error('[PATCH /api/members/[membershipId]/role]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
