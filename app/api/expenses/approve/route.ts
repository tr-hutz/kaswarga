import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(req: Request) {
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
            .select('role, rt_id, user:users(name)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (membership.role !== 'CHAIR') {
            return NextResponse.json({ error: 'Only the RT chair can approve expenses' }, { status: 403 })
        }

        const { id } = await req.json()
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

        const { error } = await supabaseAdmin.rpc('approve_expense', {
            p_id:      id,
            p_user_id: authData.user.id,
        })

        if (error) throw error

        // Activity log (fire-and-forget)
        try {
            const { data: expense } = await supabaseAdmin
                .from('expenses')
                .select('description, amount, category, date')
                .eq('id', id)
                .single()

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const actorName = (membership as any).user?.name ?? null

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       membership.rt_id,
                actor_id:    authData.user.id,
                actor_name:  actorName,
                action:      'APPROVE_EXPENSE',
                entity_type: 'expenses',
                entity_id:   id,
                description: `Approve expense: ${expense?.description ?? ''}`,
                metadata:    {
                    category:    expense?.category,
                    description: expense?.description,
                    amount:      expense?.amount,
                    date:        expense?.date,
                }
            })
        } catch {
            // Activity log errors must not block the main flow
        }

        return NextResponse.json({ ok: true })

    } catch (err) {
        console.error('[expenses/approve]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve' }, { status: 500 })
    }
}