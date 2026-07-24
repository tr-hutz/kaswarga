import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/*
|--------------------------------------------------------------------------
| POST /api/residents/import
|
| Bulk-inserts resident rows for the caller's RT.
| Restricted to chair and admin.
|
| Dedup strategy: fetch all existing (block, house_number) pairs for this
| RT in one query, filter in memory, then bulk-insert the remainder in one
| query. This avoids N sequential round-trips to Supabase.
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

        if (!['CHAIR', 'ADMIN'].includes(membership.role)) {
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

        const validRows = rows
            .filter(r => r.name?.trim())
            .map(r => ({
                rt_id:        membership.rt_id!,
                name:         r.name.trim(),
                block:        r.block?.trim()        || null,
                house_number: r.house_number?.trim() || null,
                phone:        r.phone?.trim()        || null,
                active:       true,
            }))

        if (validRows.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        // 1. Fetch all existing residents for this RT in ONE query
        const { data: existingResidents } = await supabaseAdmin
            .from('residents')
            .select('block, house_number')
            .eq('rt_id', membership.rt_id)

        // 2. Build dedup set in memory — key: `${block.lower}:${house.lower}`
        const existingKeys = new Set(
            (existingResidents || [])
                .filter(r => r.block && r.house_number)
                .map(r =>
                    `${String(r.block).toLowerCase().trim()}:${String(r.house_number).toLowerCase().trim()}`
                )
        )

        // 3. Filter out duplicates in memory
        const toInsert = validRows.filter(r => {
            if (!r.block || !r.house_number) return true
            return !existingKeys.has(`${r.block.toLowerCase()}:${r.house_number.toLowerCase()}`)
        })

        const skipped  = validRows.length - toInsert.length
        let   inserted = 0

        // 4. Bulk-insert all new rows in ONE query
        if (toInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('residents')
                .insert(toInsert)

            if (insertError) throw insertError
            inserted = toInsert.length
        }

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       membership.rt_id,
            actor_id:    authData.user.id,
            actor_name:  membership.user?.name || authData.user.email,
            action:      'IMPORT_RESIDENTS',
            entity_type: 'residents',
            entity_id:   membership.rt_id,
            description: `Import ${inserted} residents`,
            metadata:    { count: inserted, skipped }
        })

        return NextResponse.json({ inserted, skipped })

    } catch (err) {
        console.error('[residents/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}
