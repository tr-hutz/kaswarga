import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { getMemberOverrides, saveMemberOverrides } from '@/lib/services/member-override.service'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

type Params = { params: Promise<{ membershipId: string }> }

/*
|--------------------------------------------------------------------------
| GET /api/members/[membershipId]/overrides
|--------------------------------------------------------------------------
*/

export async function GET(_req: Request, { params }: Params) {
    try {
        const { membershipId } = await params
        if (!membershipId) return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 })

        const ctx    = await getRequestContext()
        const result = await getMemberOverrides(membershipId, ctx.authorization)
        return NextResponse.json(result)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[GET /api/members/[membershipId]/overrides]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}

/*
|--------------------------------------------------------------------------
| PUT /api/members/[membershipId]/overrides
|
| Body: { roleId: string; overrides: { permissionId: string; allow: boolean }[] }
|--------------------------------------------------------------------------
*/

export async function PUT(req: Request, { params }: Params) {
    try {
        const { membershipId } = await params
        if (!membershipId) return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 })

        const ctx  = await getRequestContext()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = await req.json() as { roleId?: unknown; overrides?: unknown }

        if (typeof body.roleId !== 'string') {
            return NextResponse.json({ error: 'roleId must be a string' }, { status: 400 })
        }
        if (!Array.isArray(body.overrides)) {
            return NextResponse.json({ error: 'overrides must be an array' }, { status: 400 })
        }

        const overrides = (body.overrides as unknown[])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((o): o is { permissionId: string; allow: boolean } =>
                typeof (o as any)?.permissionId === 'string' &&
                typeof (o as any)?.allow === 'boolean'
            )

        await saveMemberOverrides(membershipId, body.roleId, overrides, ctx.authorization)
        return NextResponse.json({ success: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[PUT /api/members/[membershipId]/overrides]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
