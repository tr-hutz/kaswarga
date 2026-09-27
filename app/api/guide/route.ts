import { NextResponse }         from 'next/server'
import { getRequestContext }    from '@/lib/auth/server'
import { UnauthorizedError }    from '@/lib/auth/errors'
import {
    getPublishedSections,
    getAllSections,
    createSection,
} from '@/lib/services/guide.service'

/*
|--------------------------------------------------------------------------
| GET /api/guide
| Public: returns published sections.
| Super Admin: returns all sections (including drafts).
|--------------------------------------------------------------------------
*/

export async function GET() {
    try {
        // Try to get auth context; unauthenticated users get published only.
        let sections
        try {
            const ctx = await getRequestContext()
            sections  = await getAllSections(ctx.authorization)
        } catch {
            sections = await getPublishedSections()
        }
        return NextResponse.json(sections)
    } catch (err) {
        console.error('[GET /api/guide]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/*
|--------------------------------------------------------------------------
| POST /api/guide
| Super Admin only.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        const body = await req.json() as {
            title:        string
            body:         string
            category:     string
            position:     number
            is_published: boolean
        }

        if (!body.title?.trim()) {
            return NextResponse.json({ error: 'title is required' }, { status: 400 })
        }

        const section = await createSection({
            title:        body.title,
            body:         body.body         ?? '',
            category:     body.category     ?? 'general',
            position:     body.position     ?? 0,
            is_published: body.is_published ?? false,
        }, ctx.authorization)

        return NextResponse.json(section, { status: 201 })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[POST /api/guide]', err)
        return NextResponse.json({ error: (err as Error).message || 'Internal server error' }, { status: 500 })
    }
}
