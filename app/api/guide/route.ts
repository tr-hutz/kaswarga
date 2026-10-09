import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { getPublishedSections, getAllSections, addSection } from '@/lib/services/guide.service'

export async function GET(req: Request) {
    try {
        const ctx    = await getRequestContext()
        const url    = new URL(req.url)
        const locale = url.searchParams.get('locale') ?? 'id'
        const admin  = url.searchParams.get('admin') === 'true'

        if (admin) {
            const sections = await getAllSections(ctx.authorization)
            return NextResponse.json(sections)
        }

        const sections = await getPublishedSections(locale, ctx.authorization)
        return NextResponse.json(sections)
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if ((err as Error).message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        console.error('[GET /api/guide]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        const body = await req.json() as {
            category:     string
            position:     number
            is_published: boolean
            target_roles: string[] | null
            locale:       string
            title:        string
            body:         string
        }
        const section = await addSection(body, ctx.authorization)
        return NextResponse.json(section, { status: 201 })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if ((err as Error).message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        console.error('[POST /api/guide]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
