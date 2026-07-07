import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

/*
|--------------------------------------------------------------------------
| POST /api/pengeluaran/import
|
| Bulk-inserts pengeluaran rows for the caller's RT.
| Restricted to ketua, admin, and bendahara.
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
            .from('user_membership')
            .select('role, rt_id, user:users(nama)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (!['ketua', 'admin', 'bendahara'].includes(membership.role)) {
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
            .filter(r => r.tanggal?.trim() && r.nominal?.trim())
            .map(r => ({
                rt_id:      membership.rt_id,
                tanggal:    r.tanggal.trim(),
                kategori:   r.kategori?.trim()  || null,
                nominal:    parseInt(r.nominal.replace(/[^0-9]/g, ''), 10) || 0,
                penerima:   r.penerima?.trim()  || null,
                deskripsi:  r.deskripsi?.trim() || null,
                aktif:      true,
                status:     'pending',
                created_by: authData.user.id,
            }))

        if (toInsert.length === 0) {
            return NextResponse.json({ error: 'No valid rows to insert' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('pengeluaran')
            .insert(toInsert)
            .select('id')

        if (error) throw error

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       membership.rt_id,
            actor_id:    authData.user.id,
            actor_name:  membership.user?.nama || authData.user.email,
            action:      'IMPORT_PENGELUARAN',
            entity_type: 'pengeluaran',
            entity_id:   membership.rt_id,
            description: `Import ${data.length} data pengeluaran`,
            metadata:    { count: data.length }
        })

        // Notify all ketua users with ONE grouped notification
        const { data: ketuaMembers } = await supabaseAdmin
            .from('user_membership')
            .select('user_id')
            .eq('rt_id', membership.rt_id)
            .eq('role', 'ketua')
            .eq('status', 'active')

        if (ketuaMembers?.length && data.length > 0) {
            await supabaseAdmin.from('notifications').insert(
                ketuaMembers.map(m => ({
                    rt_id:          membership.rt_id,
                    type:           'expense_pending',
                    title:          'Pengeluaran Baru Menunggu Persetujuan',
                    message:        `${data.length} pengeluaran baru diimpor dan perlu disetujui.`,
                    entity_type:    'pengeluaran',
                    entity_id:      membership.rt_id,
                    target_user_id: m.user_id,
                }))
            )
        }

        return NextResponse.json({ inserted: data.length })

    } catch (err) {
        console.error('[pengeluaran/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import gagal' }, { status: 500 })
    }
}