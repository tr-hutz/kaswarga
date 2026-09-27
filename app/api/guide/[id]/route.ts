import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { updateSection, deleteSection } from '@/lib/services/guide.service'

/*
|--------------------------------------------------------------------------
| PATCH /api/guide/[id]
| Super Admin only.
|--------------------------------------------------------------------------
*/

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()
        const body   = await req.json()

        const section = await updateSection(id, body, ctx.authorization)
        return NextResponse.json(section)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[PATCH /api/guide/:id]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/guide/[id]
| Super Admin only.
|--------------------------------------------------------------------------
*/

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()

        await deleteSection(id, ctx.authorization)
        return new NextResponse(null, { status: 204 })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[DELETE /api/guide/:id]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
