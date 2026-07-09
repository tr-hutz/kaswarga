import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://bftwjxpotkmpofdruiqc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9S7keXBfOvJqzVOBRIxK4w_pjQ2UhXt'

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

        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('memberships')
            .select('role, rt_id')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (membership.role !== 'CHAIR') {
            return NextResponse.json({ error: 'Only the RT chair can approve expenses' }, { status: 403 })
        }

        const { data, error } = await (supabaseAdmin as any).rpc('approve_all_pending_expenses', {
            p_rt_id:   membership.rt_id,
            p_user_id: authData.user.id,
        })

        if (error) throw error

        return NextResponse.json({ approved: data })

    } catch (err) {
        console.error('[expenses/approve-all]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve all' }, { status: 500 })
    }
}