import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.EXPENSE_REJECT)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const { id, reason } = await req.json()
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const { error } = await supabaseAdmin.rpc('reject_expense', {
            p_id:      id,
            p_reason:  reason || null,
            p_user_id: userId,
        })

        if (error) throw error

        try {
            const [{ data: expense }, { data: actor }] = await Promise.all([
                supabaseAdmin.from('expenses').select('description, amount, category, date').eq('id', id).single(),
                supabaseAdmin.from('users').select('name').eq('id', userId).single(),
            ])

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'REJECT_EXPENSE',
                entity_type: 'expenses',
                entity_id:   id,
                description: `Reject expense: ${expense?.description ?? ''}`,
                metadata:    {
                    category:    expense?.category,
                    description: expense?.description,
                    amount:      expense?.amount,
                    date:        expense?.date,
                    reason:      reason || null,
                }
            })
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[expenses/reject]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to reject' }, { status: 500 })
    }
}
