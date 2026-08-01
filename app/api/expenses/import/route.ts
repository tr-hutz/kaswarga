import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import { getRequestContext }  from '@/lib/auth/server'
import { requirePermission }  from '@/lib/auth/helpers'
import { PERMISSION }         from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

/*
|--------------------------------------------------------------------------
| POST /api/expenses/import
|
| Bulk-inserts expense rows for the caller's RT.
| Requires expense.create permission.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const ctx  = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.EXPENSE_CREATE)

        const rtId  = ctx.authorization.neighborhoodId
        const userId = ctx.authorization.userId

        const body = await req.json()
        const { rows } = body

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
        }

        const toInsert = rows
            .filter(r => r.date?.trim() && r.amount?.trim())
            .map(r => ({
                rt_id:       rtId,
                date:        r.date.trim(),
                category:    r.category?.trim()     || null,
                amount:      parseInt(r.amount.replace(/[^0-9]/g, ''), 10) || 0,
                recipient:   r.recipient?.trim()    || null,
                description: r.description?.trim()  || null,
                active:      true,
                status:      'pending',
                created_by:  userId,
            }))

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('expenses')
            .insert(toInsert)
            .select('id')

        if (error) throw error

        const { data: actor } = await supabaseAdmin.from('users').select('name').eq('id', userId).single()

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    userId,
            actor_name:  actor?.name ?? null,
            action:      'IMPORT_EXPENSES',
            entity_type: 'expenses',
            entity_id:   rtId,
            description: `Import ${data.length} data expenses`,
            metadata:    { count: data.length }
        })

        // Notify all members with expense.update permission via role lookup
        const { data: chairMembers } = await supabaseAdmin
            .from('memberships')
            .select('user_id')
            .eq('rt_id', rtId)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairMembers?.length && data.length > 0) {
            await supabaseAdmin.from('notifications').insert(
                chairMembers.map(m => ({
                    rt_id:          rtId,
                    type:           'expense_pending',
                    title:          'New Expenses Pending Approval',
                    message:        `${data.length} new expense(s) imported and require approval.`,
                    entity_type:    'expenses',
                    entity_id:      rtId,
                    target_user_id: m.user_id,
                }))
            )
        }

        return NextResponse.json({ inserted: data.length })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[expenses/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}
