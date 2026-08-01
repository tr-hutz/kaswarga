import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST() {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.PAYMENT_DELETE)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const { data: pending, error: fetchError } = await supabaseAdmin
            .from('payment_confirmations')
            .select('id')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .like('proof_url', '%-import-confirm-payment.xlsx')

        if (fetchError) throw fetchError
        if (!pending?.length) return NextResponse.json({ deleted: 0 })

        const ids = pending.map((r: { id: string }) => r.id)

        const { error: deleteError } = await supabaseAdmin
            .from('payment_confirmations')
            .delete()
            .in('id', ids)

        if (deleteError) throw deleteError

        const deleted = ids.length

        try {
            const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'DELETE_ALL_IMPORTED_PAYMENTS',
                entity_type: 'payment_confirmations',
                entity_id:   null,
                description: `Hapus semua pembayaran impor (${deleted} dihapus)`,
                metadata:    { deleted },
            })
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ deleted })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[payments/delete-all-imported]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to delete all' }, { status: 500 })
    }
}
