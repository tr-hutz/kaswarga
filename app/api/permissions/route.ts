import { NextResponse }     from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { getPermissions }    from '@/lib/services/permission.service'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| GET /api/permissions
|--------------------------------------------------------------------------
*/

export async function GET() {
    try {
        const ctx    = await getRequestContext()
        const result = await getPermissions(ctx.authorization)
        return NextResponse.json(result)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[GET /api/permissions]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
