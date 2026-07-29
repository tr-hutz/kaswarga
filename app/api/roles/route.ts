import { NextResponse }       from 'next/server'
import { getRequestContext }  from '@/lib/auth/server'
import { getRoles, createRole } from '@/lib/services/role.service'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'
import { DEFAULT_PAGE_SIZE }  from '@/lib/types/query'

/*
|--------------------------------------------------------------------------
| GET /api/roles
|--------------------------------------------------------------------------
*/

export async function GET(req: Request) {
    try {
        const ctx  = await getRequestContext()
        const url  = new URL(req.url)
        const p    = url.searchParams

        const result = await getRoles({
            page:          Number(p.get('page')     ?? 1),
            pageSize:      Number(p.get('pageSize') ?? DEFAULT_PAGE_SIZE),
            search:        p.get('search')        ?? undefined,
            sortBy:        p.get('sortBy')        ?? 'name',
            sortDirection: (p.get('sortDirection') === 'desc' ? 'desc' : 'asc'),
        }, ctx.authorization)

        return NextResponse.json(result)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[GET /api/roles]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/*
|--------------------------------------------------------------------------
| POST /api/roles
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        const body = await req.json()

        const { name, code, description } = body as {
            name:        string
            code:        string
            description: string | null
        }

        if (!name || !code) {
            return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
        }

        const role = await createRole({ name, code, description: description ?? null }, ctx.authorization)
        return NextResponse.json(role, { status: 201 })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[POST /api/roles]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
