import { NextResponse }           from 'next/server'
import { getRequestContext }       from '@/lib/auth/server'
import { UnauthorizedError }       from '@/lib/auth/errors'
import { notifyIncomeReviewer }    from '@/lib/services/incomeNotification.server'

/*
|--------------------------------------------------------------------------
| POST /api/income/notify
|
| Called by client-side income.service.ts after creating an income record.
| Uses notifyIncomeReviewer (supabaseAdmin) to bypass RLS policy 025 which
| restricts authenticated notification inserts to target_user_id = auth.uid().
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

        await notifyIncomeReviewer({ incomeId, rtId, incomeName, createdBy })

        return NextResponse.json({ ok: true })
    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[income/notify]', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
