import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST(req: Request) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_IMPORT)

        const rtId   = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const body = await req.json()
        const { rows } = body

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
        }

        const toInsert = rows
            .filter(r => r.received_at?.trim() && r.amount?.trim() && r.income_name?.trim())
            .map(r => ({
                rt_id:            rtId,
                income_name:      r.income_name.trim(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                income_category:  (r.income_category?.trim() || 'OTHER') as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                source_type:      (r.source_type?.trim()     || 'ANONYMOUS') as any,
                payer_name:       r.payer_name?.trim()       || null,
                is_anonymous:     !r.source_type?.trim() || r.source_type.trim() === 'ANONYMOUS',
                amount:           parseInt(r.amount.replace(/[^0-9]/g, ''), 10) || 0,
                received_at:      r.received_at.trim(),
                payment_method:   r.payment_method?.trim()   || null,
                reference_number: r.reference_number?.trim() || null,
                notes:            r.notes?.trim()            || null,
                status:           'pending',
                created_by:       userId,
            }))

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('income_transactions')
            .insert(toInsert)
            .select('id')

        if (error) throw error

        const { data: actor } = await supabaseAdmin
            .from('users').select('name').eq('id', userId).single()

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'IMPORT_INCOME',
            entity_type: 'income_transactions',
            entity_id:   rtId,
            description: `Import ${data.length} income records`,
            metadata:    { count: data.length },
        })

        const { data: chairs } = await supabaseAdmin
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairs?.length && data.length > 0) {
            await supabaseAdmin.from('notifications').insert(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (chairs as any[]).map(m => ({
                    rt_id:          rtId,
                    type:           'income_pending',
                    title:          'Pemasukan Baru Menunggu Persetujuan',
                    message:        `${data.length} data pemasukan diimpor dan menunggu persetujuan Anda.`,
                    entity_type:    'income_transactions',
                    entity_id:      rtId,
                    target_user_id: m.user_id,
                }))
            )
        }

        return NextResponse.json({ inserted: data.length })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[income/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}
