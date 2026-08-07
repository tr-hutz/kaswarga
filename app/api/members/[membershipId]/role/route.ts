import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { changeMemberRole }  from '@/lib/services/member-override.service'
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

        await changeMemberRole(membershipId, body.role.trim(), ctx.authorization)
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
