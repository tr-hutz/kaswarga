import { NextResponse }      from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase-admin'
import { getRequestContext } from '@/lib/auth/server'
import { requirePermission } from '@/lib/auth/helpers'
import { PERMISSION }        from '@/lib/auth/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/auth/errors'

type Params = { params: Promise<{ id: string }> }

export async function POST(
    _req: Request,
    { params }: Params,
) {
    try {
        const ctx    = await getRequestContext()
        requirePermission(ctx.authorization, PERMISSION.INCOME_APPROVE)

        const { id } = await params
        const userId = ctx.authorization.userId
        const rtId   = ctx.authorization.neighborhoodId

        // 1. Fetch income record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: income, error: fetchErr } = await (supabaseAdmin as any)
            .from('income_transactions')
            .select('id, rt_id, income_name, amount, status, created_by, campaign_id, income_category')
            .eq('id', id)
            .is('deleted_at', null)
            .single()

        if (fetchErr || !income) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (income.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 409 })

        const now = new Date().toISOString()

        // 2. Update status to approved
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (supabaseAdmin as any)
            .from('income_transactions')
            .update({
                status:      'approved',
                approved_by: userId,
                approved_at: now,
                updated_at:  now,
                updated_by:  userId,
            })
            .eq('id', id)

        if (updateErr) throw updateErr

        // 3. Insert ledger entry (pemasukan, source=income)
        const { error: ledgerErr } = await supabaseAdmin.rpc('insert_ledger', {
            p_rt_id:        income.rt_id,
            p_type:         'pemasukan',
            p_source:       'income',
            p_reference_id: income.id,
            p_date:         now,
            p_description:  income.income_name,
            p_amount:       income.amount,
            p_created_by:   userId,
        })

        if (ledgerErr) throw ledgerErr

        // 3b. Synchronous campaign completion check
        if (income.campaign_id && income.income_category === 'DONATION') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: campaign } = await (supabaseAdmin as any)
                .from('income_campaigns')
                .select('id, name, target_amount, status')
                .eq('id', income.campaign_id)
                .single()

            if (campaign && campaign.status === 'ACTIVE' && campaign.target_amount != null) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: sumRows } = await (supabaseAdmin as any)
                    .from('income_transactions')
                    .select('amount')
                    .eq('campaign_id', income.campaign_id)
                    .eq('income_category', 'DONATION')
                    .eq('status', 'approved')
                    .is('deleted_at', null)

                const approvedTotal = (sumRows ?? []).reduce((sum: number, r: { amount: number }) => sum + (r.amount ?? 0), 0)

                if (approvedTotal >= campaign.target_amount) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (supabaseAdmin as any)
                        .from('income_campaigns')
                        .update({ status: 'COMPLETED', updated_at: now, updated_by: userId })
                        .eq('id', income.campaign_id)

                    // Campaign completed activity log + notifications (non-blocking)
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { data: actor } = await (supabaseAdmin as any).from('users').select('name').eq('id', userId).single()
                        await supabaseAdmin.from('activity_logs').insert({
                            rt_id:       rtId,
                            actor_id:    userId,
                            actor_name:  actor?.name ?? null,
                            action:      'campaign_completed',
                            entity_type: 'campaign',
                            entity_id:   income.campaign_id,
                            description: `Kampanye selesai: ${campaign.name}`,
                            visibility:  'internal',
                        })

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { data: adminMembers } = await (supabaseAdmin as any)
                            .from('memberships')
                            .select('user_id')
                            .eq('rt_id', rtId)
                            .in('role', ['ADMIN', 'CHAIR'])
                            .eq('status', 'active')

                        const notifs = (adminMembers ?? []).map((m: { user_id: string }) => ({
                            rt_id:          rtId,
                            type:           'campaign_completed',
                            title:          'Kampanye Selesai',
                            message:        `Kampanye "${campaign.name}" telah mencapai target.`,
                            entity_type:    'campaign',
                            entity_id:      income.campaign_id,
                            target_user_id: m.user_id,
                        }))

                        if (notifs.length) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await (supabaseAdmin as any).from('notifications').insert(notifs)
                        }
                    } catch { /* non-critical */ }
                }
            }
        }

        // 4. Activity log + notification (non-blocking)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: actor } = await (supabaseAdmin as any)
                .from('users')
                .select('name')
                .eq('id', userId)
                .single()

            await supabaseAdmin.from('activity_logs').insert({
                rt_id:       rtId,
                actor_id:    userId,
                actor_name:  actor?.name ?? null,
                action:      'APPROVE_INCOME',
                entity_type: 'income_transactions',
                entity_id:   id,
                description: `Approve income: ${income.income_name}`,
                visibility:  'internal',
                metadata:    { amount: income.amount },
            })

            if (income.created_by) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabaseAdmin as any).from('notifications').insert({
                    rt_id:          rtId,
                    type:           'income_approved',
                    title:          'Pemasukan Disetujui',
                    message:        `Pemasukan "${income.income_name}" telah disetujui.`,
                    entity_type:    'income_transactions',
                    entity_id:      id,
                    target_user_id: income.created_by,
                })
            }
        } catch {
            // non-critical — do not block the response
        }

        return NextResponse.json({ ok: true })

    } catch (err) {
        if (err instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (err instanceof ForbiddenError)    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
        console.error('[income/approve]', err)
        return NextResponse.json({ error: (err as Error).message || 'Failed to approve' }, { status: 500 })
    }
}
