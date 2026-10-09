import { NextResponse }      from 'next/server'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'
import { supabaseAdmin }     from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const ctx    = await getRequestContext()
        const body   = await req.json() as { is_helpful: boolean }

        // guide_section_feedback is added by migration 034; types are regenerated on next supabase gen types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('guide_section_feedback')
            .upsert(
                { section_id: id, user_id: ctx.authorization.userId, is_helpful: body.is_helpful },
                { onConflict: 'section_id,user_id' }
            )

        if (error) {
            console.error('[POST /api/guide/[id]/feedback]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[POST /api/guide/[id]/feedback]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
