import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.EXPENSE_APPROVE)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const { error } = await supabaseAdmin.rpc('approve_expense', {
            p_id:      id,
            p_user_id: userId,
        })

        if (error) throw error

        try {
            const [{ data: expense }, { data: actor }] = await Promise.all([
                supabaseAdmin.from('expenses').select('description, amount, category, date, created_by, rt_id, receipt_number').eq('id', id).single(),
                supabaseAdmin.from('users').select('name').eq('id', userId).single(),
            ])

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'APPROVE_EXPENSE',
                entity_type: 'expenses',
                entity_id:   id,
                description: `Approve expense: ${expense?.description ?? ''}`,
                metadata:    {
                    category:    expense?.category,
                    description: expense?.description,
                    amount:      expense?.amount,
                    date:        expense?.date,
                }
            })

            if (expense?.created_by) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin as any).from('notifications').insert({
                    rt_id:          expense.rt_id,
                    type:           'expense_approved',
                    title:          'Pengeluaran Disetujui',
                    message:        'Pengeluaran ' + (expense.receipt_number || '') + ' telah disetujui',
                    entity_type:    'expenses',
                    entity_id:      id,
                    target_user_id: expense.created_by,
                })
            }
        } catch {
            // Activity log / notification errors must not block the main flow
        }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[expenses/approve]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve' }, { status: 500 })
    }
}
