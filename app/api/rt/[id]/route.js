import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'
const SYSTEM_RT_ID      = '00000000-0000-0000-0000-000000000001'

/*
|--------------------------------------------------------------------------
| DELETE /api/rt/[id]
|
| Soft-deletes an RT and deactivates all its members.
| Restricted to super_admin.
|--------------------------------------------------------------------------
*/

export async function DELETE(req, { params }) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json({ error: 'Missing RT id' }, { status: 400 })
        }

        // Verify caller is super_admin
        const cookieStore = await cookies()
        const serverClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (newCookies) => newCookies.forEach(c => cookieStore.set(c))
            }
        })

        const { data: authData, error: authError } = await serverClient.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('user_membership')
            .select('role, user:users(nama)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || membership?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch RT name for the activity log
        const { data: rt, error: rtError } = await supabaseAdmin
            .from('rt')
            .select('nama, kode')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle()

        if (rtError || !rt) {
            return NextResponse.json({ error: 'RT not found' }, { status: 404 })
        }

        // Soft-delete the RT
        const { error: deleteError } = await supabaseAdmin
            .from('rt')
            .update({ deleted_at: new Date().toISOString(), aktif: false, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (deleteError) throw deleteError

        // Deactivate all memberships for this RT
        const { error: membershipUpdateError } = await supabaseAdmin
            .from('user_membership')
            .update({ status: 'deactivated' })
            .eq('rt_id', id)

        if (membershipUpdateError) throw membershipUpdateError

        // Log activity
        await supabaseAdmin
            .from('activity_logs')
            .insert({
                rt_id:       SYSTEM_RT_ID,
                actor_id:    authData.user.id,
                actor_name:  membership.user?.nama || authData.user.email,
                action:      'DELETE_RT',
                entity_type: 'rt',
                entity_id:   id,
                description: `Deleted RT: ${rt.nama}`,
                metadata:    { nama: rt.nama, kode: rt.kode }
            })

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error('[DELETE /api/rt/[id]]', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}