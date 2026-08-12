/*
 * Expense Import Definition
 *
 * Approval policy: BATCH — validated rows enter PENDING_APPROVAL and require
 * RT Chair batch approval before being committed to the expenses table.
 * After batch approval, persist() inserts expenses as status='pending' and
 * they flow into the existing per-record expense approval workflow.
 */

import { supabaseAdmin }      from '@/lib/supabase-admin'
import { PERMISSION }         from '@/lib/auth/types'
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
/* Domain payload type                                                         */
/* -------------------------------------------------------------------------- */

interface ExpensePayload {
    rt_id:       string
    date:        string
    category:    string | null
    amount:      number
    recipient:   string | null
    description: string | null
    active:      boolean
    status:      string
    created_by:  string
}

/* -------------------------------------------------------------------------- */
/* Preloaded context (existing expenses for dedup)                            */
/* -------------------------------------------------------------------------- */

interface ExpensePreloaded {
    existingSet: Set<string>  // `${date}:${amount}:${description.lower}`
    [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/* Column definitions                                                          */
/* -------------------------------------------------------------------------- */

const COLUMNS: ImportColumn[] = [
    { key: 'date',        label: 'Tanggal',    required: true  },
    { key: 'amount',      label: 'Nominal',    required: true  },
    { key: 'category',    label: 'Kategori',   required: false },
    { key: 'recipient',   label: 'Penerima',   required: false },
    { key: 'description', label: 'Keterangan', required: false },
]

const TEMPLATE: ImportTemplate = {
    columnAliases: {
        tanggal:     'date',
        tgl:         'date',
        date:        'date',
        kategori:    'category',
        category:    'category',
        nominal:     'amount',
        jumlah:      'amount',
        amount:      'amount',
        biaya:       'amount',
        penerima:    'recipient',
        mitra:       'recipient',
        vendor:      'recipient',
        recipient:   'recipient',
        deskripsi:   'description',
        keterangan:  'description',
        description: 'description',
        ket:         'description',
    },
    sampleRows: [
        { date: '2026-07-03', category: 'Operasional', amount: '150000', recipient: 'Toko Bangunan Jaya', description: 'Pembelian cat pagar' },
        { date: '2026-07-05', category: 'Kebersihan',  amount: '75000',  recipient: 'Pak Budi',           description: 'Biaya kebersihan lingkungan' },
        { date: '2026-07-10', category: 'Keamanan',    amount: '200000', recipient: 'Pak Satpam',         description: 'Honor keamanan Juli' },
    ],
    sheetName: 'Expenses',
    fileName:  'expense-import-template.xlsx',
}

/* -------------------------------------------------------------------------- */
/* Definition                                                                  */
/* -------------------------------------------------------------------------- */

export const expenseImportDefinition: ImportDefinition<ExpensePayload> = {
    type:              IMPORT_TYPE.EXPENSE,
    importPermission:  PERMISSION.EXPENSE_IMPORT,
    approvePermission: PERMISSION.EXPENSE_APPROVE,
    approvalPolicy:    APPROVAL_POLICY.BATCH,
    columns:           COLUMNS,
    template:          TEMPLATE,

    async preload(context: ImportContext): Promise<ExpensePreloaded> {
        const { data } = await supabaseAdmin
            .from('expenses')
            .select('date, amount, description')
            .eq('rt_id', context.rtId)
            .eq('active', true)

        const existingSet = new Set<string>(
            ((data ?? []) as Array<{ date: string; amount: number; description: string | null }>)
                .map(e => `${e.date}:${e.amount}:${String(e.description ?? '').toLowerCase().trim()}`)
        )
        return { existingSet }
    },

    validateRow(row: RawRow, context: ImportContext): RowValidationResult {
        const { existingSet } = context as unknown as ExpensePreloaded & ImportContext

        if (!row.date?.trim())   return { valid: false, errorCode: 'MISSING_DATE',   errorMessage: 'Tanggal wajib diisi' }
        if (!row.amount?.trim()) return { valid: false, errorCode: 'MISSING_AMOUNT', errorMessage: 'Nominal wajib diisi' }

        const amount = parseInt(row.amount.replace(/[^0-9]/g, ''), 10)
        if (isNaN(amount) || amount <= 0) {
            return { valid: false, errorCode: 'INVALID_AMOUNT', errorMessage: 'Nominal tidak valid' }
        }

        const dedupKey = `${row.date.trim()}:${amount}:${(row.description?.trim() || '').toLowerCase()}`
        if (existingSet?.has(dedupKey)) {
            return { valid: false, skipped: true, skipReason: 'DUPLICATE_EXPENSE', errorMessage: 'Data pengeluaran sudah ada (duplikat)' }
        }
        existingSet?.add(dedupKey)

        return { valid: true }
    },

    transform(row: RawRow, context: ImportContext): ExpensePayload {
        const amount = parseInt(row.amount.replace(/[^0-9]/g, ''), 10) || 0
        return {
            rt_id:       context.rtId,
            date:        row.date.trim(),
            category:    row.category?.trim()    || null,
            amount,
            recipient:   row.recipient?.trim()   || null,
            description: row.description?.trim() || null,
            active:      true,
            status:      'pending',
            created_by:  context.userId,
        }
    },

    async persist(rows: ExpensePayload[], context: ImportContext): Promise<PersistResult> {
        if (rows.length === 0) return { inserted: 0, skipped: 0 }

        // Idempotency: skip rows already inserted by a previous partial run
        const { data: existingRecs, error: existingError } = await supabaseAdmin
            .from('expenses')
            .select('date, amount, description')
            .eq('rt_id', context.rtId)
            .eq('active', true)
        if (existingError) throw new Error(existingError.message ?? JSON.stringify(existingError))

        const existingSet = new Set<string>()
        for (const e of (existingRecs ?? []) as Array<{ date: string; amount: number; description: string | null }>) {
            existingSet.add(`${e.date}:${e.amount}:${String(e.description ?? '').toLowerCase().trim()}`)
        }

        const dedupKey  = (r: ExpensePayload) =>
            `${r.date}:${r.amount}:${String(r.description ?? '').toLowerCase().trim()}`
        const newRows   = rows.filter(r => !existingSet.has(dedupKey(r)))
        const skipped   = rows.length - newRows.length

        if (newRows.length === 0) return { inserted: 0, skipped }

        // Step 1: Insert expense rows as 'pending' — existing approval flow takes over
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('expenses')
            .insert(newRows)
            .select('id')
        if (insertError) throw new Error(insertError.message ?? JSON.stringify(insertError))

        const insertedCount = ((inserted ?? []) as Array<{ id: string }>).length

        // Step 2: Activity log
        const { data: actor } = await supabaseAdmin
            .from('users').select('name').eq('id', context.userId).single()

        await supabaseAdmin.from('activity_logs').insert({
            rt_id:       context.rtId,
            actor_id:    context.userId,
            actor_name:  actor?.name ?? null,
            action:      'IMPORT_EXPENSES',
            entity_type: 'expenses',
            entity_id:   context.rtId,
            description: `Import ${insertedCount} data pengeluaran dari file (job ${context.jobId})`,
            metadata:    { inserted: insertedCount, skipped, jobId: context.jobId },
        })

        return { inserted: insertedCount, skipped }
    },
}
