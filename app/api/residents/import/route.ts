import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

/*
|--------------------------------------------------------------------------
| POST /api/residents/import
|
| Bulk-inserts warga rows for the caller's RT.
| Restricted to ketua and admin.
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

        const toInsert = rows
            .filter(r => r.name?.trim())
            .map(r => ({
                rt_id:        membership.rt_id,
                name:         r.name.trim(),
                block:        r.block?.trim()        || null,
                house_number: r.house_number?.trim() || null,
                phone:        r.phone?.trim()        || null,
                active:       true,
            }))

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('residents')
            .insert(toInsert)
            .select('id')

        if (error) throw error

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       membership.rt_id,
            actor_id:    authData.user.id,
            actor_name:  membership.user?.name || authData.user.email,
            action:      'IMPORT_RESIDENTS',
            entity_type: 'residents',
            entity_id:   membership.rt_id,
            description: `Import ${data.length} data warga`,
            metadata:    { count: data.length }
        })

        return NextResponse.json({ inserted: data.length })

    } catch (err) {
        console.error('[warga/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import gagal' }, { status: 500 })
    }
}