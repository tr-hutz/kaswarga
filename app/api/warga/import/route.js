import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

/*
|--------------------------------------------------------------------------
| POST /api/warga/import
|
| Bulk-inserts warga rows for the caller's RT.
| Restricted to ketua and admin.
|--------------------------------------------------------------------------
*/

export async function POST(req) {
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
            .from('user_membership')
            .select('role, rt_id, user:users(nama)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (!['ketua', 'admin'].includes(membership.role)) {
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
            .filter(r => r.nama?.trim())
            .map(r => ({
                rt_id:    membership.rt_id,
                nama:     r.nama.trim(),
                blok:     r.blok?.trim()     || null,
                no_rumah: r.no_rumah?.trim() || null,
                no_hp:    r.no_hp?.trim()    || null,
                aktif:    true,
            }))

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('warga')
            .insert(toInsert)
            .select('id')

        if (error) throw error

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       membership.rt_id,
            actor_id:    authData.user.id,
            actor_name:  membership.user?.nama || authData.user.email,
            action:      'IMPORT_WARGA',
            entity_type: 'warga',
            entity_id:   membership.rt_id,
            description: `Import ${data.length} data warga`,
            metadata:    { count: data.length }
        })

        return NextResponse.json({ inserted: data.length })

    } catch (err) {
        console.error('[warga/import]', err)
        return NextResponse.json({ error: err.message || 'Import gagal' }, { status: 500 })
    }
}