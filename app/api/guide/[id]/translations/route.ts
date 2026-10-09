import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { addTranslation }    from '@/lib/services/guide.service'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()
        const body   = await req.json() as { locale: string; title: string; body: string }
        const result = await addTranslation(id, body.locale, body.title, body.body, ctx.authorization)
        return NextResponse.json(result)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if ((err as Error).message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        console.error('[PUT /api/guide/[id]/translations]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
