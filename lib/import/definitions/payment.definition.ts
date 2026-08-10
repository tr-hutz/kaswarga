/*
 * Payment Import Definition
 *
 * Approval policy: BATCH — rows enter PENDING_APPROVAL after validation.
 * RT Chair (approvePermission) approves the batch; persist() is then called.
 *
 * persist() is the final step: it creates payment_confirmations (approved),
 * confirmation_details, payments, payment_details, and ledger entries in one
 * transaction. No separate TREASURER approval is required for imported data.
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
    residentMap: Map<string, string>
    /** `${resident_id}:${year}:${month}` — keys loaded from DB (PAYMENT_ALREADY_EXISTS) */
    dbSet:       Set<string>
    /** `${resident_id}:${year}:${month}` — accumulates during validation (DUPLICATE_PAYMENT_IN_FILE) */
    fileSet:     Set<string>
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
    importPermission:  PERMISSION.PAYMENT_IMPORT,
    approvePermission: PERMISSION.PAYMENT_IMPORT_APPROVE,
    approvalPolicy:    APPROVAL_POLICY.BATCH,
    columns:           COLUMNS,
    template:          TEMPLATE,

    async preload(context: ImportContext): Promise<PaymentPreloaded> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: residents } = await (supabaseAdmin as any)
            .from('residents')
            .select('id, block, house_number')
            .eq('rt_id', context.rtId)

        const residentMap = new Map<string, string>()
        for (const r of (residents ?? []) as Array<{ id: string; block: string | null; house_number: string | null }>) {
            if (r.block && r.house_number) {
                residentMap.set(
                    `${String(r.block).toLowerCase().trim()}:${String(r.house_number).toLowerCase().trim()}`,
                    r.id
                )
            }
        }

        const residentIds = Array.from(residentMap.values())
        let existingRows: Array<{ resident_id: string; year: number; month: number }> = []
        if (residentIds.length > 0) {
            // Only block rows whose confirmation is NOT rejected (pending/processing/approved).
            // Rejected confirmations allow re-import so users can fix and resubmit.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: activeConfirms } = await (supabaseAdmin as any)
                .from('payment_confirmations')
                .select('id')
                .in('resident_id', residentIds)
                .eq('rt_id', context.rtId)
                .neq('status', 'rejected')

            const activeIds = ((activeConfirms ?? []) as Array<{ id: string }>).map(c => c.id)
            if (activeIds.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data } = await (supabaseAdmin as any)
                    .from('confirmation_details')
                    .select('resident_id, year, month')
                    .in('confirmation_id', activeIds)
                existingRows = data ?? []
            }
        }

        const dbSet = new Set<string>(
            existingRows.map(d => `${d.resident_id}:${d.year}:${d.month}`)
        )

        return { residentMap, dbSet, fileSet: new Set<string>() }
    },

    validateRow(row: RawRow, context: ImportContext): RowValidationResult {
        const { residentMap, dbSet, fileSet } = context as unknown as PaymentPreloaded & ImportContext

        if (!row.block?.trim())        return { valid: false, errorCode: 'MISSING_BLOCK',        errorMessage: 'Blok wajib diisi' }
        if (!row.house_number?.trim()) return { valid: false, errorCode: 'MISSING_HOUSE_NUMBER', errorMessage: 'Nomor rumah wajib diisi' }
        if (!row.year?.trim())         return { valid: false, errorCode: 'MISSING_YEAR',         errorMessage: 'Tahun wajib diisi' }
        if (!row.month?.trim())        return { valid: false, errorCode: 'MISSING_MONTH',        errorMessage: 'Bulan wajib diisi' }
        if (!row.amount?.trim())       return { valid: false, errorCode: 'MISSING_AMOUNT',       errorMessage: 'Nominal wajib diisi' }

        const year   = parseInt(row.year.trim(),  10)
        const month  = parseInt(row.month.trim(), 10)
        const amount = parseInt(row.amount.replace(/[^0-9]/g, ''), 10)

        if (isNaN(year))                         return { valid: false, errorCode: 'INVALID_YEAR',   errorMessage: 'Tahun tidak valid' }
        if (isNaN(month) || month < 1 || month > 12) {
            return { valid: false, errorCode: 'INVALID_MONTH', errorMessage: 'Bulan harus antara 1-12' }
        }
        if (isNaN(amount) || amount <= 0) {
            return { valid: false, errorCode: 'INVALID_AMOUNT', errorMessage: 'Nominal harus berupa angka positif' }
        }

        const residentKey = `${row.block.toLowerCase().trim()}:${row.house_number.toLowerCase().trim()}`
        const residentId  = residentMap?.get(residentKey)
        if (!residentId) {
            return { valid: false, errorCode: 'RESIDENT_NOT_FOUND', errorMessage: `Warga blok ${row.block} no. ${row.house_number} tidak ditemukan` }
        }

        const dedupKey = `${residentId}:${year}:${month}`

        // Within-file duplicate (same row appears earlier in this file)
        if (fileSet?.has(dedupKey)) {
            return { valid: false, skipped: true, skipReason: 'DUPLICATE_PAYMENT_IN_FILE', errorMessage: `Pembayaran ${year}/${month} duplikat dalam file ini` }
        }

        // Existing DB conflict
        if (dbSet?.has(dedupKey)) {
            return { valid: false, skipped: true, skipReason: 'PAYMENT_ALREADY_EXISTS', errorMessage: `Pembayaran ${year}/${month} sudah ada` }
        }

        fileSet?.add(dedupKey)
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

        const now      = new Date().toISOString()
        const proofUrl = `${context.jobId}-import-confirm-payment.xlsx`

        // ── Cleanup: remove any payment_confirmations left by a previous partial run ─
        // Cascade deletes their confirmation_details automatically.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('payment_confirmations')
            .delete()
            .eq('rt_id', context.rtId)
            .eq('proof_url', proofUrl)

        // ── Idempotency: skip rows whose payment_details already exist ────────────
        // payment_details has UNIQUE(resident_id, year, month) — any row that already
        // landed there from a previous partial run is complete and can be skipped.
        const residentIds = [...new Set(rows.map(r => r.residentId))]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingDetails } = await (supabaseAdmin as any)
            .from('payment_details')
            .select('resident_id, year, month')
            .in('resident_id', residentIds)

        const existingSet = new Set(
            ((existingDetails ?? []) as Array<{ resident_id: string; year: number; month: number }>)
                .map(d => `${d.resident_id}:${d.year}:${d.month}`)
        )

        const newRows = rows.filter(r => !existingSet.has(`${r.residentId}:${r.year}:${r.month}`))
        const skipped = rows.length - newRows.length

        if (newRows.length === 0) return { inserted: 0, skipped }

        // ── Step 1: payment_confirmations — one per monthly row ───────────────────
        // Each imported monthly row gets its own confirmation (total_amount = that month).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: confirmations, error: confError } = await (supabaseAdmin as any)
            .from('payment_confirmations')
            .insert(newRows.map(r => ({
                resident_id:  r.residentId,
                rt_id:        context.rtId,
                year:         r.year,
                total_amount: r.amount,
                status:       'approved',
                approved_at:  now,
                proof_url:    proofUrl,
            })))
            .select('id')
        if (confError) throw new Error(confError.message ?? JSON.stringify(confError))

        const confIds = ((confirmations ?? []) as Array<{ id: string }>).map(c => c.id)

        // ── Step 2: confirmation_details — one per confirmation ───────────────────
        const confirmDetails = newRows.map((r, i) => ({
            confirmation_id: confIds[i],
            resident_id:     r.residentId,
            year:            r.year,
            month:           r.month,
            amount:          r.amount,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: cdError } = await (supabaseAdmin as any).from('confirmation_details').insert(confirmDetails)
        if (cdError) throw new Error(cdError.message ?? JSON.stringify(cdError))

        // ── Step 3: payments — one per monthly row ────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: payments, error: paymentError } = await (supabaseAdmin as any)
            .from('payments')
            .insert(newRows.map(r => ({
                resident_id:  r.residentId,
                rt_id:        context.rtId,
                year:         r.year,
                total_amount: r.amount,
                date:         now,
            })))
            .select('id, total_amount')
        if (paymentError) throw new Error(paymentError.message ?? JSON.stringify(paymentError))

        const paymentList = (payments ?? []) as Array<{ id: string; total_amount: number }>

        // ── Step 4: payment_details — one per payment ─────────────────────────────
        const paymentDetails = newRows.map((r, i) => ({
            payment_id:  paymentList[i].id,
            resident_id: r.residentId,
            year:        r.year,
            month:       r.month,
            amount:      r.amount,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: pdError } = await (supabaseAdmin as any)
            .from('payment_details')
            .upsert(paymentDetails, { onConflict: 'resident_id,year,month', ignoreDuplicates: true })
        if (pdError) throw new Error(pdError.message ?? JSON.stringify(pdError))

        // ── Step 5: ledger entries — one per payment ──────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: lastLedger } = await (supabaseAdmin as any)
            .from('ledger')
            .select('balance_after')
            .eq('rt_id', context.rtId)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()

        let runningBalance = (lastLedger as { balance_after: number } | null)?.balance_after ?? 0
        const ledgerRows = paymentList.map(p => {
            runningBalance += p.total_amount
            return {
                rt_id:         context.rtId,
                type:          'pemasukan',
                source:        'pembayaran',
                reference_id:  p.id,
                date:          now,
                description:   'Pembayaran iuran warga',
                amount:        p.total_amount,
                balance_after: runningBalance,
                created_by:    context.userId,
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: ledgerError } = await (supabaseAdmin as any).from('ledger').insert(ledgerRows)
        if (ledgerError) throw new Error(ledgerError.message ?? JSON.stringify(ledgerError))

        // ── Step 6: activity log ──────────────────────────────────────────────────
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
                entity_type: 'payments',
                entity_id:   context.rtId,
                description: `Import ${newRows.length} pembayaran dari file (job ${context.jobId})`,
                metadata:    { payments: newRows.length, skipped, jobId: context.jobId },
            })

        return { inserted: newRows.length, skipped }
    },
}
