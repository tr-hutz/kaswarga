import { NextResponse }        from 'next/server'
import { getRequestContext }   from '@/lib/auth/server'
import { updateRole, setRoleActive } from '@/lib/services/role.service'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

type Params = { params: Promise<{ id: string }> }

/*
|--------------------------------------------------------------------------
| PATCH /api/roles/[id]
|
| Supports two operations:
|   - { name, description }         → update metadata
|   - { is_active: boolean }        → activate / deactivate
|--------------------------------------------------------------------------
*/

export async function PATCH(req: Request, { params }: Params) {
    try {
        const { id } = await params
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const ctx  = await getRequestContext()
        const body = await req.json() as Record<string, unknown>

        // Activate / deactivate
        if ('is_active' in body) {
            const role = await setRoleActive(id, Boolean(body.is_active), ctx.authorization)
            return NextResponse.json(role)
        }

        // Update metadata
        const role = await updateRole(
            id,
            {
                name:        body.name        as string | undefined,
                description: body.description as string | null | undefined,
            },
            ctx.authorization,
        )
        return NextResponse.json(role)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        if ((err as Error).message === 'Role not found') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        console.error('[PATCH /api/roles/[id]]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
