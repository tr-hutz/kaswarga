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

        const { incomeId, rtId, incomeName, createdBy } = await req.json() as {
            incomeId:   string
            rtId:       string
            incomeName: string | null
            createdBy?: string | null
        }

        if (!incomeId || !rtId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Maker-checker: if submitter is a Treasurer, escalate to Chair instead
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rt } = await (supabaseAdmin as any)
            .from('rt').select('maker_checker_enabled').eq('id', rtId).single()
        const makerCheckerEnabled = rt?.maker_checker_enabled ?? true

        let submitterIsTreasurer = false
        if (makerCheckerEnabled && createdBy) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: submitterMembership } = await (supabaseAdmin as any)
                .from('memberships')
                .select('role')
                .eq('user_id', createdBy)
                .eq('rt_id', rtId)
                .eq('status', 'active')
                .maybeSingle()
            submitterIsTreasurer = submitterMembership?.role === 'TREASURER'
        }

        const targetRole = (makerCheckerEnabled && submitterIsTreasurer) ? 'CHAIR' : 'TREASURER'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: reviewers } = await (supabaseAdmin as any)
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', targetRole)
            .eq('status', 'active')

        if (reviewers && reviewers.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows = (reviewers as any[]).map((m: any) => ({
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
