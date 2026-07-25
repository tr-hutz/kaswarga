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
|
| Dedup strategy:
|   1. Fetch all RT residents in one query, build an in-memory lookup map.
|   2. Fetch all existing confirmation_details for matched residents in one
|      query, build an in-memory dedup set.
|   3. Bulk-insert payment_confirmations (one per group) and get IDs back.
|   4. Bulk-insert all confirmation_details in one query.
|
| This reduces N×4 sequential Supabase round-trips to ~4 total.
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

        // Upload Excel file to storage
        const fileName   = buildFileName(rtName)
        const ws         = XLSX.utils.json_to_sheet(rows)
        const wb         = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Data')
        const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

        // Upload is best-effort: a bucket config issue must never block the import.
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('payment-proof')
            .upload(fileName, xlsxBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                upsert: false,
            })

        if (uploadError) {
            console.warn('[payments/import] storage upload skipped:', uploadError.message)
        }

        const publicUrl = uploadData
            ? supabaseAdmin.storage.from('payment-proof').getPublicUrl(uploadData.path).data.publicUrl
            : null

        // Group rows by block + house_number + year
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

        if (groups.size === 0) {
            return NextResponse.json({ inserted: 0, skipped: rows.length })
        }

        // 1. Fetch ALL residents for this RT in one query, build lookup map
        const { data: allResidents } = await supabaseAdmin
            .from('residents')
            .select('id, block, house_number')
            .eq('rt_id', rtId)

        const residentMap = new Map<string, string>() // `${block.lower}:${house.lower}` → id
        for (const r of allResidents || []) {
            if (r.block && r.house_number) {
                residentMap.set(
                    `${String(r.block).toLowerCase().trim()}:${String(r.house_number).toLowerCase().trim()}`,
                    r.id
                )
            }
        }

        // 2. Resolve each group to a resident + compute months/amount
        type ResolvedGroup = {
            residentId:  string
            year:        number
            months:      number[]
            totalAmount: number
            groupRows:   Record<string, string>[]
        }

        const resolved: ResolvedGroup[] = []

        for (const [key, groupRows] of groups) {
            const [block, house, yearStr] = key.split('||')
            const year = parseInt(yearStr, 10)
            if (isNaN(year)) { skipped += groupRows.length; continue }

            const residentId = residentMap.get(`${block.toLowerCase()}:${house.toLowerCase()}`)
            if (!residentId) { skipped += groupRows.length; continue }

            const months = groupRows
                .map(r => parseInt(r.month?.trim() ?? '', 10))
                .filter(m => !isNaN(m) && m >= 1 && m <= 12)

            if (!months.length) { skipped += groupRows.length; continue }

            resolved.push({ residentId, year, months, groupRows, totalAmount: 0 })
        }

        if (resolved.length === 0) {
            return NextResponse.json({ inserted: 0, skipped })
        }

        // 3. Fetch existing confirmation_details for all resolved residents in ONE query
        const residentIds = [...new Set(resolved.map(g => g.residentId))]
        const years       = [...new Set(resolved.map(g => g.year))]

        const { data: existingDetails } = await supabaseAdmin
            .from('confirmation_details')
            .select('resident_id, year, month')
            .in('resident_id', residentIds)
            .in('year', years)

        const existingSet = new Set(
            (existingDetails || []).map(
                (d: { resident_id: string; year: number; month: number }) =>
                    `${d.resident_id}:${d.year}:${d.month}`
            )
        )

        // 4. Filter out already-existing months from each group
        const toInsert = resolved
            .map(g => {
                const newMonths = g.months.filter(
                    m => !existingSet.has(`${g.residentId}:${g.year}:${m}`)
                )
                skipped += g.months.length - newMonths.length

                const totalAmount = g.groupRows
                    .filter(r => {
                        const m = parseInt(r.month?.trim() ?? '', 10)
                        return newMonths.includes(m)
                    })
                    .reduce((sum, r) =>
                        sum + (parseInt(r.amount?.replace(/[^0-9]/g, '') ?? '0', 10) || 0), 0
                    )

                return { ...g, months: newMonths, totalAmount }
            })
            .filter(g => g.months.length > 0)

        if (toInsert.length === 0) {
            return NextResponse.json({ inserted: 0, skipped })
        }

        // 5. Bulk-insert payment_confirmations and get IDs back
        const { data: insertedConfirmations, error: confirmError } = await supabaseAdmin
            .from('payment_confirmations')
            .insert(
                toInsert.map(g => ({
                    resident_id:  g.residentId,
                    rt_id:        rtId,
                    year:         g.year,
                    total_amount: g.totalAmount,
                    status:       'pending',
                    proof_url:    publicUrl,
                }))
            )
            .select('id, resident_id, year')

        if (confirmError || !insertedConfirmations) throw confirmError ?? new Error('Insert confirmations failed')

        // Build map: `${resident_id}:${year}` → confirmation_id
        const confirmMap = new Map<string, string>()
        for (const c of insertedConfirmations) {
            confirmMap.set(`${c.resident_id}:${c.year}`, c.id)
        }

        // 6. Build and bulk-insert all confirmation_details in ONE query
        const allDetails = toInsert.flatMap(g => {
            const confirmId = confirmMap.get(`${g.residentId}:${g.year}`)
            if (!confirmId) return []

            return g.months.map(month => {
                const row = g.groupRows.find(r => parseInt(r.month?.trim() ?? '', 10) === month)
                return {
                    confirmation_id: confirmId,
                    resident_id:     g.residentId,
                    year:            g.year,
                    month,
                    amount:          parseInt(row?.amount?.replace(/[^0-9]/g, '') ?? '0', 10) || 0,
                }
            })
        })

        if (allDetails.length > 0) {
            const { error: detailsError } = await supabaseAdmin
                .from('confirmation_details')
                .insert(allDetails)

            if (detailsError) throw detailsError
        }

        inserted = toInsert.length

        // Activity log
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

        // Notify treasurers
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
