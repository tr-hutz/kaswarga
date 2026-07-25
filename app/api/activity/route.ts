import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| POST /api/activity
|
| Writes an activity log entry using the service-role client (bypasses RLS).
| Using supabaseAdmin here is intentional: logActivity is fire-and-forget
| and may be called right before logout(), at which point the browser client's
| session is already cleared and the RLS check on activity_logs fails.
|--------------------------------------------------------------------------
*/
export async function POST(req: Request) {
    try {
        const body = await req.json()

        const {
            rtId,
            actorId,
            actorName,
            action,
            entityType,
            entityId,
            description,
            metadata,
        } = body as {
            rtId?:        string | null
            actorId?:     string | null
            actorName?:   string | null
            action:       string
            entityType:   string
            entityId?:    string | null
            description:  string
            metadata?:    Record<string, unknown>
        }

        if (!action || !entityType || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId       ?? SYSTEM_RT_ID,
            actor_id:    actorId    ?? null,
            actor_name:  actorName  ?? null,
            action,
            entity_type: entityType,
            entity_id:   entityId   ?? null,
            description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata:    (metadata ?? {}) as any,
        })

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('[api/activity]', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
