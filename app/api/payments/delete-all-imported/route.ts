/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST() {
    try {
        const cookieStore = await cookies()
        const serverClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} }
        })

        const { data: authData, error: authError } = await serverClient.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: membership, error: membershipError } = await (supabaseAdmin as any)
            .from('memberships')
            .select('role, rt_id, user:users(name)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (!['TREASURER', 'ADMIN'].includes(membership.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const rtId = membership.rt_id as string

        const { data: pending, error: fetchError } = await supabaseAdmin
            .from('payment_confirmations')
            .select('id')
            .eq('rt_id', rtId)
            .eq('status', 'pending')
            .like('proof_url', '%-import-confirm-payment.xlsx')

        if (fetchError) throw fetchError
        if (!pending?.length) return NextResponse.json({ deleted: 0 })

        const ids = pending.map((r: { id: string }) => r.id)

        const { error: deleteError } = await supabaseAdmin
            .from('payment_confirmations')
            .delete()
            .in('id', ids)

        if (deleteError) throw deleteError

        const deleted = ids.length

        try {
            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    authData.user.id,
                actor_name:  (membership as any).user?.name ?? null,
                action:      'DELETE_ALL_IMPORTED_PAYMENTS',
                entity_type: 'payment_confirmations',
                entity_id:   null,
                description: `Hapus semua pembayaran impor (${deleted} dihapus)`,
                metadata:    { deleted },
            })
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ deleted })

    } catch (err) {
        console.error('[payments/delete-all-imported]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to delete all' }, { status: 500 })
    }
}
