import { NextResponse }      from 'next/server'
import { cookies }            from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin }      from '@/lib/supabase-admin'
import * as XLSX              from 'xlsx'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/*
|--------------------------------------------------------------------------
| POST /api/payments/import
|
| Bulk-imports payment confirmations from Excel for the caller's RT.
| Restricted to treasurer and admin.
| Each imported row group (block + house_number + year) becomes one
| payment_confirmation with pending status. The uploaded Excel file is
| stored in the payment-proof bucket and used as proof_url for all
| created confirmations, distinguishing them from resident-submitted ones.
|--------------------------------------------------------------------------
*/

function buildFileName(rtName: string): string {
    const safe = rtName.replace(/\s+/g, '_')
    const now  = new Date()
    const dd   = String(now.getDate()).padStart(2, '0')
    const MM   = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = String(now.getFullYear())
    const HH   = String(now.getHours()).padStart(2, '0')
    const mm   = String(now.getMinutes()).padStart(2, '0')
    return `${safe}-${dd}${MM}${yyyy}${HH}${mm}-import-confirm-payment.xlsx`
}

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: membership, error: membershipError } = await (supabaseAdmin as any)
            .from('memberships')
            .select('role, rt_id, user:users(name), rt:rt(name)')
            .eq('user_id', authData.user.id)
            .eq('status', 'active')
            .maybeSingle()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Membership not found' }, { status: 403 })
        }

        if (!['TREASURER', 'ADMIN'].includes(membership.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const rtId   = membership.rt_id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rtName = (membership as any).rt?.name ?? 'RT'

        const body = await req.json()
        const { rows } = body as { rows: Record<string, string>[] }

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
        }

        // 1. Reconstruct Excel from rows and upload to payment-proof bucket
        const fileName   = buildFileName(rtName)
        const ws         = XLSX.utils.json_to_sheet(rows)
        const wb         = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Data')
        const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('payment-proof')
            .upload(fileName, xlsxBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                upsert: false,
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('payment-proof')
            .getPublicUrl(uploadData.path)

        // 2. Group rows by block + house_number + year
        const groups = new Map<string, Record<string, string>[]>()
        for (const row of rows) {
            const block = row.block?.trim() ?? ''
            const house = row.house_number?.trim() ?? ''
            const year  = row.year?.trim() ?? ''
            if (!block || !house || !year) continue
            const key = `${block}||${house}||${year}`
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(row)
        }

        let inserted = 0
        let skipped  = 0

        // 3. For each group: resolve resident, deduplicate months, insert
        for (const [key, groupRows] of groups) {
            const [block, house, yearStr] = key.split('||')
            const year = parseInt(yearStr, 10)
            if (isNaN(year)) { skipped += groupRows.length; continue }

            const { data: resident } = await supabaseAdmin
                .from('residents')
                .select('id')
                .eq('rt_id', rtId)
                .ilike('block', block)
                .ilike('house_number', house)
                .maybeSingle()

            if (!resident) { skipped += groupRows.length; continue }

            const monthsInGroup = groupRows
                .map(r => parseInt(r.month?.trim() ?? '', 10))
                .filter(m => !isNaN(m) && m >= 1 && m <= 12)

            if (!monthsInGroup.length) { skipped += groupRows.length; continue }

            // Deduplication: resident_id + year + month must be unique
            const { data: existing } = await supabaseAdmin
                .from('confirmation_details')
                .select('month')
                .eq('resident_id', resident.id)
                .eq('year', year)
                .in('month', monthsInGroup)

            const existingMonths = new Set((existing ?? []).map((d: { month: number }) => d.month))
            const newRows = groupRows.filter(r => {
                const m = parseInt(r.month?.trim() ?? '', 10)
                return !isNaN(m) && !existingMonths.has(m)
            })

            skipped += groupRows.length - newRows.length
            if (!newRows.length) continue

            const totalAmount = newRows.reduce((sum, r) => {
                return sum + (parseInt(r.amount?.replace(/[^0-9]/g, '') ?? '0', 10) || 0)
            }, 0)

            const { data: confirmation, error: confirmError } = await supabaseAdmin
                .from('payment_confirmations')
                .insert({
                    resident_id:  resident.id,
                    rt_id:        rtId,
                    year,
                    total_amount: totalAmount,
                    status:       'pending',
                    proof_url:    publicUrl,
                })
                .select('id')
                .single()

            if (confirmError || !confirmation) { skipped += newRows.length; continue }

            await supabaseAdmin.from('confirmation_details').insert(
                newRows.map(r => ({
                    confirmation_id: confirmation.id,
                    resident_id:     resident.id,
                    year,
                    month:           parseInt(r.month.trim(), 10),
                    amount:          parseInt(r.amount?.replace(/[^0-9]/g, '') ?? '0', 10) || 0,
                }))
            )
            inserted++
        }

        // 4. Activity log
        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       rtId,
            actor_id:    authData.user.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            actor_name:  (membership as any).user?.name || authData.user.email,
            action:      'IMPORT_PAYMENTS',
            entity_type: 'payment_confirmations',
            entity_id:   rtId,
            description: `Import ${inserted} data pembayaran (${skipped} dilewati)`,
            metadata:    { inserted, skipped, fileName },
        })

        // 5. Notify all TREASURER members so they can review
        if (inserted > 0) {
            const { data: treasurers } = await supabaseAdmin
                .from('memberships')
                .select('user_id')
                .eq('rt_id', rtId)
                .eq('role', 'TREASURER')
                .eq('status', 'active')

            if (treasurers?.length) {
                await supabaseAdmin.from('notifications').insert(
                    treasurers.map((m: { user_id: string }) => ({
                        rt_id:          rtId,
                        type:           'payment_pending',
                        title:          'Pembayaran Impor Menunggu Persetujuan',
                        message:        `${inserted} data pembayaran diimpor dan menunggu persetujuan.`,
                        entity_type:    'payment_confirmations',
                        entity_id:      rtId,
                        target_user_id: m.user_id,
                    }))
                )
            }
        }

        return NextResponse.json({ inserted, skipped })

    } catch (err) {
        console.error('[payments/import]', err)
        return NextResponse.json({ error: (err as Error).message || 'Import failed' }, { status: 500 })
    }
}
