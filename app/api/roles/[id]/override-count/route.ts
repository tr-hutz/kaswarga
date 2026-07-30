import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { PERMISSION }        from '@/lib/auth/types'
import { ForbiddenError, UnauthorizedError } from '@/lib/auth/errors'
import { getOverrideCountForRole } from '@/lib/repositories/member-override.repository'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
    try {
        const { id } = await params
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const ctx  = await getRequestContext()
        const auth = ctx.authorization

        if (!auth.hasPermission(PERMISSION.PERMISSION_VIEW)) {
            throw new ForbiddenError(PERMISSION.PERMISSION_VIEW)
        }

        const count = await getOverrideCountForRole(auth.neighborhoodId, id)
        return NextResponse.json({ count })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[GET /api/roles/[id]/override-count]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
