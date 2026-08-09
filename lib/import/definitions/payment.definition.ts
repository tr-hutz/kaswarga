/*
 * Payment Import Definition
 *
 * Business rules for importing payment confirmations.
 * Preserves ALL existing payment import behaviour from /api/payments/import.
 * The framework handles lifecycle; this file owns resident matching,
 * dedup, grouping, and persistence of payment_confirmations.
 *
 * Approval policy: BATCH — rows enter PENDING_APPROVAL after validation.
 * The approver (TREASURER / RT_CHAIR) commits via the approve endpoint.
 *
 * NOTE: persist() on approval inserts payment_confirmations + confirmation_details.
 * The subsequent payment approval workflow (TREASURER approving individual
 * payment_confirmations) is separate from the import approval.
 */

import { supabaseAdmin }       from '@/lib/supabase-admin'
import { PERMISSION }          from '@/lib/auth/types'
import {
    IMPORT_TYPE,
    APPROVAL_POLICY,
    type RawRow,
    type RowValidationResult,
    type PersistResult,
    type ImportContext,
} from '../types'
import type {
    ImportDefinition,
    ImportColumn,
    ImportTemplate,
} from '../contract'

/* -------------------------------------------------------------------------- */
/* Domain payload types                                                        */
/* -------------------------------------------------------------------------- */

interface PaymentRowPayload {
    residentId:  string
    year:        number
    month:       number
    amount:      number
    rawRow:      RawRow
}

/* -------------------------------------------------------------------------- */
/* Preloaded context                                                           */
/* -------------------------------------------------------------------------- */

interface PaymentPreloaded {
    /** `${block.lower}:${house.lower}` → resident_id */
    residentMap:  Map<string, string>
    /** `${resident_id}:${year}:${month}` — already-confirmed months */
    existingSet:  Set<string>
    [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/* Column definitions                                                          */
/* -------------------------------------------------------------------------- */

const COLUMNS: ImportColumn[] = [
    { key: 'block',        label: 'Blok',         required: true  },
    { key: 'house_number', label: 'Nomor Rumah',  required: true  },
    { key: 'year',         label: 'Tahun',        required: true  },
    { key: 'month',        label: 'Bulan',        required: true  },
    { key: 'amount',       label: 'Nominal',      required: true  },
]

const TEMPLATE: ImportTemplate = {
    columnAliases: {
        blok:         'block',
        block:        'block',
        nomor_rumah:  'house_number',
        house_number: 'house_number',
        no_rumah:     'house_number',
        tahun:        'year',
        year:         'year',
        bulan:        'month',
        month:        'month',
        jumlah:       'amount',
        nominal:      'amount',
        amount:       'amount',
    },
    sampleRows: [
        { block: 'A', house_number: '1', year: '2026', month: '1', amount: '150000' },
        { block: 'A', house_number: '1', year: '2026', month: '2', amount: '150000' },
        { block: 'B', house_number: '5', year: '2026', month: '1', amount: '150000' },
    ],
    sheetName: 'Pembayaran',
    fileName:  'payment-import-template.xlsx',
}

/* -------------------------------------------------------------------------- */
/* Definition                                                                  */
/* -------------------------------------------------------------------------- */

export const paymentImportDefinition: ImportDefinition<PaymentRowPayload> = {
    type:              IMPORT_TYPE.PAYMENT,
    importPermission:  PERMISSION.PAYMENT_UPDATE,
    approvePermission: PERMISSION.PAYMENT_APPROVE,
    approvalPolicy:    APPROVAL_POLICY.BATCH,
    columns:           COLUMNS,
    template:          TEMPLATE,

    async preload(context: ImportContext): Promise<PaymentPreloaded> {
        const [{ data: residents }, { data: existingDetails }] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('residents')
                .select('id, block, house_number')
                .eq('rt_id', context.rtId),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabaseAdmin as any)
                .from('confirmation_details')
                .select('resident_id, year, month')
                .in('resident_id',
                    // We'll filter by RT residents; fetch broadly first
                    // (this is pre-filtered below after building the map)
                    ['00000000-0000-0000-0000-000000000000']  // placeholder
                ),
        ])

        const residentMap = new Map<string, string>()
        for (const r of (residents ?? []) as Array<{ id: string; block: string | null; house_number: string | null }>) {
            if (r.block && r.house_number) {
                residentMap.set(
                    `${String(r.block).toLowerCase().trim()}:${String(r.house_number).toLowerCase().trim()}`,
                    r.id
                )
            }
        }

        // Fetch existing confirmations for residents in this RT
        const residentIds = Array.from(residentMap.values())
        let existingRows: Array<{ resident_id: string; year: number; month: number }> = []
        if (residentIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabaseAdmin as any)
                .from('confirmation_details')
                .select('resident_id, year, month')
                .in('resident_id', residentIds)
            existingRows = data ?? []
        }

        const existingSet = new Set<string>(
            existingRows.map(d => `${d.resident_id}:${d.year}:${d.month}`)
        )

        return { residentMap, existingSet }
    },

    validateRow(row: RawRow, context: ImportContext): RowValidationResult {
        const { residentMap, existingSet } = context as unknown as PaymentPreloaded & ImportContext

        if (!row.block?.trim())        return { valid: false, errorCode: 'MISSING_BLOCK',        errorMessage: 'Blok wajib diisi' }
        if (!row.house_number?.trim()) return { valid: false, errorCode: 'MISSING_HOUSE_NUMBER', errorMessage: 'Nomor rumah wajib diisi' }
        if (!row.year?.trim())         return { valid: false, errorCode: 'MISSING_YEAR',         errorMessage: 'Tahun wajib diisi' }
        if (!row.month?.trim())        return { valid: false, errorCode: 'MISSING_MONTH',        errorMessage: 'Bulan wajib diisi' }
        if (!row.amount?.trim())       return { valid: false, errorCode: 'MISSING_AMOUNT',       errorMessage: 'Nominal wajib diisi' }

        const year  = parseInt(row.year.trim(),  10)
        const month = parseInt(row.month.trim(), 10)

        if (isNaN(year))                   return { valid: false, errorCode: 'INVALID_YEAR',   errorMessage: 'Tahun tidak valid' }
        if (isNaN(month) || month < 1 || month > 12) {
            return { valid: false, errorCode: 'INVALID_MONTH', errorMessage: 'Bulan harus antara 1-12' }
        }

        const residentKey = `${row.block.toLowerCase().trim()}:${row.house_number.toLowerCase().trim()}`
        const residentId  = residentMap?.get(residentKey)
        if (!residentId) {
            return { valid: false, errorCode: 'RESIDENT_NOT_FOUND', errorMessage: `Warga blok ${row.block} no. ${row.house_number} tidak ditemukan` }
        }

        // Dedup check
        const dedupKey = `${residentId}:${year}:${month}`
        if (existingSet?.has(dedupKey)) {
            return { valid: false, skipped: true, skipReason: 'DUPLICATE_PAYMENT', errorMessage: `Pembayaran ${year}/${month} sudah ada` }
        }
        existingSet?.add(dedupKey)

        return { valid: true }
    },

    transform(row: RawRow, context: ImportContext): PaymentRowPayload {
        const { residentMap } = context as unknown as PaymentPreloaded & ImportContext
        const residentKey = `${row.block.toLowerCase().trim()}:${row.house_number.toLowerCase().trim()}`
        const residentId  = residentMap!.get(residentKey)!

        return {
            residentId,
            year:   parseInt(row.year.trim(),  10),
            month:  parseInt(row.month.trim(), 10),
            amount: parseInt(row.amount.replace(/[^0-9]/g, ''), 10) || 0,
            rawRow: row,
        }
    },

    async persist(rows: PaymentRowPayload[], context: ImportContext): Promise<PersistResult> {
        if (rows.length === 0) return { inserted: 0, skipped: 0 }

        // Group by residentId + year for payment_confirmations
        const groups = new Map<string, { residentId: string; year: number; months: { month: number; amount: number }[] }>()

        for (const row of rows) {
            const key = `${row.residentId}:${row.year}`
            if (!groups.has(key)) {
                groups.set(key, { residentId: row.residentId, year: row.year, months: [] })
            }
            groups.get(key)!.months.push({ month: row.month, amount: row.amount })
        }

        const groupList = Array.from(groups.values())

        // Bulk-insert payment_confirmations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: confirmations, error: confirmError } = await (supabaseAdmin as any)
            .from('payment_confirmations')
            .insert(
                groupList.map(g => ({
                    resident_id:  g.residentId,
                    rt_id:        context.rtId,
                    year:         g.year,
                    total_amount: g.months.reduce((s, m) => s + m.amount, 0),
                    status:       'pending',
                }))
            )
            .select('id, resident_id, year')

        if (confirmError) throw confirmError

        // Map for detail insertion
        const confirmMap = new Map<string, string>()
        for (const c of (confirmations as Array<{ id: string; resident_id: string; year: number }>)) {
            confirmMap.set(`${c.resident_id}:${c.year}`, c.id)
        }

        // Bulk-insert confirmation_details
        const details = groupList.flatMap(g => {
            const confirmId = confirmMap.get(`${g.residentId}:${g.year}`)
            if (!confirmId) return []
            return g.months.map(m => ({
                confirmation_id: confirmId,
                resident_id:     g.residentId,
                year:            g.year,
                month:           m.month,
                amount:          m.amount,
            }))
        })

        if (details.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: detailError } = await (supabaseAdmin as any)
                .from('confirmation_details')
                .insert(details)
            if (detailError) throw detailError
        }

        // Notify treasurers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: treasurers } = await (supabaseAdmin as any)
            .from('memberships')
            .select('user_id')
            .eq('rt_id', context.rtId)
            .eq('role', 'TREASURER')
            .eq('status', 'active')

        if (treasurers?.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any)
                .from('notifications')
                .insert(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (treasurers as any[]).map(m => ({
                        rt_id:          context.rtId,
                        type:           'payment_pending',
                        title:          'Pembayaran Impor Menunggu Persetujuan',
                        message:        `${rows.length} data pembayaran diimpor dan menunggu persetujuan.`,
                        entity_type:    'import_jobs',
                        entity_id:      context.jobId,
                        target_user_id: m.user_id,
                    }))
                )
        }

        const { data: actor } = await supabaseAdmin
            .from('users').select('name').eq('id', context.userId).single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('activity_logs')
            .insert({
                rt_id:       context.rtId,
                actor_id:    context.userId,
                actor_name:  actor?.name ?? null,
                action:      'IMPORT_PAYMENTS',
                entity_type: 'payment_confirmations',
                entity_id:   context.rtId,
                description: `Import ${groupList.length} konfirmasi pembayaran (import job ${context.jobId})`,
                metadata:    { inserted: groupList.length, jobId: context.jobId },
            })

        return { inserted: groupList.length, skipped: 0 }
    },
}
