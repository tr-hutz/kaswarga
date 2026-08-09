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

        const validRows = rows.filter(r => r.date?.trim() && r.amount?.trim())

        if (validRows.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        // Fetch existing non-deleted expense records for this RT to detect duplicates.
        // Dedup key: date + amount + description (case-insensitive).
        const { data: existing } = await supabaseAdmin
            .from('expenses')
            .select('date, amount, description')
            .eq('rt_id', rtId)
            .eq('active', true)

        const existingSet = new Set(
            (existing || []).map(e =>
                `${e.date}:${e.amount}:${String(e.description ?? '').toLowerCase().trim()}`
            )
        )

        let skipped = rows.length - validRows.length

        const toInsert = validRows
            .map(r => ({
                rt_id:       rtId,
                date:        r.date.trim(),
                category:    r.category?.trim()    || null,
                amount:      parseInt(r.amount.replace(/[^0-9]/g, ''), 10) || 0,
                recipient:   r.recipient?.trim()   || null,
                description: r.description?.trim() || null,
                active:      true,
                status:      'pending',
                created_by:  userId,
            }))
            .filter(r => {
                const key = `${r.date}:${r.amount}:${String(r.description ?? '').toLowerCase().trim()}`
                if (existingSet.has(key)) { skipped++; return false }
                // Add to set so within-batch duplicates are also caught
                existingSet.add(key)
                return true
            })

        if (toInsert.length === 0) {
            return NextResponse.json({ inserted: 0, skipped })
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
            description: `Import ${data.length} data pengeluaran (${skipped} dilewati sebagai duplikat)`,
            metadata:    { inserted: data.length, skipped }
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
                    title:          'Pengeluaran Baru Menunggu Persetujuan',
                    message:        `${data.length} data pengeluaran diimpor dan menunggu persetujuan Anda.`,
                    entity_type:    'expenses',
                    entity_id:      rtId,
                    target_user_id: m.user_id,
                }))
            )
        }

        return NextResponse.json({ inserted: data.length, skipped })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[expenses/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}
