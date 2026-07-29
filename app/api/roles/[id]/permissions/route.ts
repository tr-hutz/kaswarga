import { NextResponse }           from 'next/server'
import { getRequestContext }      from '@/lib/auth/server'
import { getRolePermissions, saveRolePermissions } from '@/lib/services/permission.service'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

type Params = { params: Promise<{ id: string }> }

/*
|--------------------------------------------------------------------------
| GET /api/roles/[id]/permissions
|--------------------------------------------------------------------------
*/

export async function GET(_req: Request, { params }: Params) {
    try {
        const { id }  = await params
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const ctx    = await getRequestContext()
        const result = await getRolePermissions(id, ctx.authorization)
        return NextResponse.json(result)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[GET /api/roles/[id]/permissions]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/*
|--------------------------------------------------------------------------
| PUT /api/roles/[id]/permissions
|
| Replaces the full set of role permissions for the given role.
| Body: { permissionIds: string[] }
|--------------------------------------------------------------------------
*/

export async function PUT(req: Request, { params }: Params) {
    try {
        const { id }  = await params
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const ctx  = await getRequestContext()
        const body = await req.json() as { permissionIds?: unknown }

        if (!Array.isArray(body.permissionIds)) {
            return NextResponse.json({ error: 'permissionIds must be an array' }, { status: 400 })
        }

        const permissionIds = (body.permissionIds as unknown[])
            .filter((x): x is string => typeof x === 'string')

        await saveRolePermissions(id, permissionIds, ctx.authorization)
        return NextResponse.json({ success: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[PUT /api/roles/[id]/permissions]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
