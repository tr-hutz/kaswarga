import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/expenses/notify
|
| Fire-and-forget endpoint called by expense.service.ts after creating an
| expense. Uses supabaseAdmin (service role) to insert notifications for
| all active CHAIR members in the RT, bypassing the RLS policy on
| notifications that restricts authenticated inserts to target_user_id = auth.uid()
| (025_rbac_notifications_insert_policy.sql).
|
| Body: { expenseId: string, rtId: string, receiptNumber: string | null }
|--------------------------------------------------------------------------
*/
export async function POST(req: Request) {
    try {
        const ctx = await getRequestContext()
        void ctx // just validate the session is present

        const { expenseId, rtId, receiptNumber } = await req.json() as {
            expenseId:     string
            rtId:          string
            receiptNumber: string | null
        }

        if (!expenseId || !rtId) {
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
                type:           'expense_pending',
                title:          'Pengeluaran Baru',
                message:        `Pengeluaran ${receiptNumber || ''} menunggu persetujuan Anda`,
                entity_type:    'expenses',
                entity_id:      expenseId,
                target_user_id: m.user_id,
            }))

            const { error } = await supabaseAdmin.from('notifications').insert(rows)
            if (error) console.error('[expenses/notify] insert failed', error)
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[expenses/notify]', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
