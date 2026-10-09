import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { editSection, removeSection } from '@/lib/services/guide.service'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()
        const body   = await req.json() as {
            category?:     string
            position?:     number
            is_published?: boolean
            target_roles?: string[] | null
            locale:        string
            title?:        string
            body?:         string
        }
        const section = await editSection(id, body, ctx.authorization)
        return NextResponse.json(section)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if ((err as Error).message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        console.error('[PATCH /api/guide/[id]]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()
        await removeSection(id, ctx.authorization)
        return NextResponse.json({ success: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if ((err as Error).message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        console.error('[DELETE /api/guide/[id]]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
