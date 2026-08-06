import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { UnauthorizedError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/payments/import-notify
|
| Sends ONE notification to all treasurers after a bulk import completes.
| Called once by the client after all import batches finish, so that
| batching (useImport splits large files into chunks) does not create
| duplicate notifications.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const ctx    = await getRequestContext()
        const rtId   = ctx.authorization.neighborhoodId

        const { inserted } = await req.json() as { inserted?: number }
        if (!inserted || inserted <= 0) return NextResponse.json({ ok: true })

        const { data: treasurers } = await supabaseAdmin
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'TREASURER')
            .eq('status', 'active')

        if (treasurers?.length) {
            await supabaseAdmin.from('notifications').insert(
                treasurers.map((m: { user_id: string }) => ({
                    rt_id:          rtId,
                    type:           'payment_pending',
                    title:          'Pembayaran Impor Menunggu Persetujuan',
                    message:        `${inserted} data pembayaran diimpor dan menunggu persetujuan.`,
                    entity_type:    'payment_confirmations',
                    entity_id:      rtId,
                    target_user_id: m.user_id,
                }))
            )
        }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        console.error('[payments/import-notify]', err)
        return NextResponse.json({ ok: true }) // best-effort — notification failure must not surface as an error
    }
}
