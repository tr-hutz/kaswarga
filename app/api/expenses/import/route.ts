import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

/*
|--------------------------------------------------------------------------
| POST /api/expenses/import
|
| Bulk-inserts expense rows for the caller's RT.
| Restricted to chair, admin, and treasurer.
|--------------------------------------------------------------------------
*/

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const serverClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {}
            }
        })

        const { data: authData, error: authError } = await serverClient.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('memberships')
            .select('role, rt_id, user:users(name)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (!['CHAIR', 'ADMIN', 'TREASURER'].includes(membership.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!membership.rt_id) {
            return NextResponse.json({ error: 'RT not found' }, { status: 400 })
        }

        const body = await req.json()
        const { rows } = body

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
        }

        const toInsert = rows
            .filter(r => r.date?.trim() && r.amount?.trim())
            .map(r => ({
                rt_id:       membership.rt_id,
                date:        r.date.trim(),
                category:    r.category?.trim()     || null,
                amount:      parseInt(r.amount.replace(/[^0-9]/g, ''), 10) || 0,
                recipient:   r.recipient?.trim()    || null,
                description: r.description?.trim()  || null,
                active:      true,
                status:      'pending',
                created_by:  authData.user.id,
            }))

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('expenses')
            .insert(toInsert)
            .select('id')

        if (error) throw error

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       membership.rt_id,
            actor_id:    authData.user.id,
            actor_name:  membership.user?.name || authData.user.email,
            action:      'IMPORT_EXPENSES',
            entity_type: 'expenses',
            entity_id:   membership.rt_id,
            description: `Import ${data.length} data expenses`,
            metadata:    { count: data.length }
        })

        // Notify all CHAIR users with ONE grouped notification
        const { data: chairMembers } = await supabaseAdmin
            .from('memberships')
            .select('user_id')
            .eq('rt_id', membership.rt_id)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairMembers?.length && data.length > 0) {
            await supabaseAdmin.from('notifications').insert(
                chairMembers.map(m => ({
                    rt_id:          membership.rt_id,
                    type:           'expense_pending',
                    title:          'New Expenses Pending Approval',
                    message:        `${data.length} new expense(s) imported and require approval.`,
                    entity_type:    'expenses',
                    entity_id:      membership.rt_id,
                    target_user_id: m.user_id,
                }))
            )
        }

        return NextResponse.json({ inserted: data.length })

    } catch (err) {
        console.error('[expenses/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}