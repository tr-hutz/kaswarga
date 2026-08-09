import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/income/notify
|
| Fire-and-forget endpoint called by income.service.ts after creating an
| income record. Uses supabaseAdmin (service role) to bypass RLS policy
| 025 which restricts authenticated notification inserts to
| target_user_id = auth.uid().
|
| Body: { incomeId: string, rtId: string, incomeName: string | null }
|--------------------------------------------------------------------------
*/
export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext()
        void ctx // validate session is present

        const { incomeId, rtId, incomeName } = await req.json() as {
            incomeId:   string
            rtId:       string
            incomeName: string | null
        }

        if (!incomeId || !rtId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: chairs } = await (supabaseAdmin as any)
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairs && chairs.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows = (chairs as any[]).map((m: any) => ({
                rt_id:          rtId,
                type:           'income_pending',
                title:          'Pemasukan Baru',
                message:        `Pemasukan "${incomeName || ''}" menunggu persetujuan Anda`,
                entity_type:    'income_transactions',
                entity_id:      incomeId,
                target_user_id: m.user_id,
            }))

            const { error } = await supabaseAdmin.from('notifications').insert(rows)
            if (error) console.error('[income/notify] insert failed', error)
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[income/notify]', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
