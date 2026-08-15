/*
 * Income Import Definition
 *
 * Approval policy: BATCH — rows enter PENDING_APPROVAL after validation.
 * RT Chair approves the batch; persist() is then called.
 *
 * persist() creates income_transactions (approved), ledger entries,
 * and an activity log entry. No separate individual-record approval
 * is required — the import batch approval covers them all.
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

interface IncomePayload {
    rt_id:            string
    income_name:      string
    income_category:  string
    source_type:      string
    payer_name:       string | null
    is_anonymous:     boolean
    amount:           number
    received_at:      string
    payment_method:   string | null
    reference_number: string | null
    notes:            string | null
    created_by:       string
    import_job_id:    string
}

/* -------------------------------------------------------------------------- */
/* Preloaded context (existing income for dedup)                              */
/* -------------------------------------------------------------------------- */

interface IncomePreloaded {
    existingSet: Set<string>  // `${name.lower}:${received_at}:${amount}`
    [key: string]: unknown
}

/* -------------------------------------------------------------------------- */
/* Column definitions                                                          */
/* -------------------------------------------------------------------------- */

const COLUMNS: ImportColumn[] = [
    { key: 'received_at',      label: 'Tanggal',        required: true  },
    { key: 'income_name',      label: 'Nama Pemasukan', required: true  },
    { key: 'amount',           label: 'Nominal',        required: true  },
    { key: 'income_category',  label: 'Kategori',       required: false },
    { key: 'source_type',      label: 'Sumber',         required: false },
    { key: 'payer_name',       label: 'Pemberi',        required: false },
    { key: 'payment_method',   label: 'Metode',         required: false },
    { key: 'reference_number', label: 'Referensi',      required: false },
    { key: 'notes',            label: 'Catatan',        required: false },
]

const TEMPLATE: ImportTemplate = {
    columnAliases: {
        tanggal:          'received_at',
        tgl:              'received_at',
        received_at:      'received_at',
        nama:             'income_name',
        income_name:      'income_name',
        kategori:         'income_category',
        income_category:  'income_category',
        nominal:          'amount',
        jumlah:           'amount',
        amount:           'amount',
        sumber:           'source_type',
        source_type:      'source_type',
        pemberi:          'payer_name',
        payer_name:       'payer_name',
        metode:           'payment_method',
        payment_method:   'payment_method',
        referensi:        'reference_number',
        reference_number: 'reference_number',
        catatan:          'notes',
        notes:            'notes',
    },
    sampleRows: [
        {
            received_at: '2026-07-01', income_name: 'Iuran Keamanan',
            income_category: 'DONATION', amount: '500000',
            source_type: 'RESIDENT', payer_name: '', payment_method: 'CASH', notes: '',
        },
        {
            received_at: '2026-07-05', income_name: 'Bantuan Pemerintah',
            income_category: 'GOVERNMENT', amount: '2000000',
            source_type: 'GOVERNMENT', payer_name: 'Kelurahan X', payment_method: 'TRANSFER', notes: 'Dana bantuan Q3',
        },
    ],
    sheetName: 'Income',
    fileName:  'income-import-template.xlsx',
}

/* -------------------------------------------------------------------------- */
/* Definition                                                                  */
/* -------------------------------------------------------------------------- */

export const incomeImportDefinition: ImportDefinition<IncomePayload> = {
    type:              IMPORT_TYPE.INCOME,
    importPermission:  PERMISSION.INCOME_IMPORT,
    approvePermission: PERMISSION.INCOME_APPROVE,
    approvalPolicy:    APPROVAL_POLICY.BATCH,
    columns:           COLUMNS,
    template:          TEMPLATE,

    async preload(context: ImportContext): Promise<IncomePreloaded> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabaseAdmin as any)
            .from('income_transactions')
            .select('income_name, received_at, amount')
            .eq('rt_id', context.rtId)
            .is('deleted_at', null)

        const existingSet = new Set<string>(
            ((data ?? []) as Array<{ income_name: string; received_at: string; amount: number }>)
                .map(e => `${String(e.income_name).toLowerCase().trim()}:${e.received_at}:${e.amount}`)
        )

        return { existingSet }
    },

    validateRow(row: RawRow, context: ImportContext): RowValidationResult {
        const { existingSet } = context as unknown as IncomePreloaded & ImportContext

        if (!row.received_at?.trim())  return { valid: false, errorCode: 'MISSING_DATE',   errorMessage: 'Tanggal wajib diisi' }
        if (!row.income_name?.trim())  return { valid: false, errorCode: 'MISSING_NAME',   errorMessage: 'Nama pemasukan wajib diisi' }
        if (!row.amount?.trim())       return { valid: false, errorCode: 'MISSING_AMOUNT', errorMessage: 'Nominal wajib diisi' }

        const amount = parseInt(row.amount.replace(/[^0-9]/g, ''), 10)
        if (isNaN(amount) || amount <= 0) {
            return { valid: false, errorCode: 'INVALID_AMOUNT', errorMessage: 'Nominal tidak valid' }
        }

        const dedupKey = `${row.income_name.toLowerCase().trim()}:${row.received_at.trim()}:${amount}`
        if (existingSet?.has(dedupKey)) {
            return { valid: false, skipped: true, skipReason: 'DUPLICATE_INCOME', errorMessage: 'Data pemasukan sudah ada (duplikat)' }
        }
        existingSet?.add(dedupKey)

        return { valid: true }
    },

    transform(row: RawRow, context: ImportContext): IncomePayload {
        const amount = parseInt(row.amount.replace(/[^0-9]/g, ''), 10) || 0

        const VALID_CATEGORIES = new Set(['DONATION', 'GOVERNMENT', 'EVENT', 'BAZAAR', 'RENTAL', 'SALES', 'INTEREST', 'OTHER'])
        const VALID_SOURCES    = new Set(['RESIDENT', 'NON_RESIDENT', 'ORGANIZATION', 'GOVERNMENT', 'ANONYMOUS'])

        const rawCategory    = (row.income_category?.trim() || '').toUpperCase()
        const rawSource      = (row.source_type?.trim()     || '').toUpperCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incomeCategory = (VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'OTHER')     as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceType     = (VALID_SOURCES.has(rawSource)      ? rawSource   : 'ANONYMOUS') as any

        return {
            rt_id:            context.rtId,
            income_name:      row.income_name.trim(),
            income_category:  incomeCategory,
            source_type:      sourceType,
            payer_name:       row.payer_name?.trim()       || null,
            is_anonymous:     sourceType === 'ANONYMOUS',
            amount,
            received_at:      row.received_at.trim(),
            payment_method:   row.payment_method?.trim()   || null,
            reference_number: row.reference_number?.trim() || null,
            notes:            row.notes?.trim()            || null,
            created_by:       context.userId,
            import_job_id:    context.jobId,
        }
    },

    async persist(rows: IncomePayload[], context: ImportContext): Promise<PersistResult> {
        if (rows.length === 0) return { inserted: 0, skipped: 0 }

        const now = new Date().toISOString()

        // ── Idempotency: skip rows already inserted by a previous partial run ─
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingRecs, error: existingError } = await (supabaseAdmin as any)
            .from('income_transactions')
            .select('id, income_name, received_at, amount')
            .eq('rt_id', context.rtId)
            .is('deleted_at', null)
        if (existingError) throw new Error(existingError.message ?? JSON.stringify(existingError))

        const existingMap = new Map<string, string>()
        for (const e of (existingRecs ?? []) as Array<{ id: string; income_name: string; received_at: string; amount: number }>) {
            existingMap.set(`${String(e.income_name).toLowerCase().trim()}:${e.received_at}:${e.amount}`, e.id)
        }

        const dedupKey  = (r: IncomePayload) => `${r.income_name.toLowerCase().trim()}:${r.received_at}:${r.amount}`
        const newRows   = rows.filter(r => !existingMap.has(dedupKey(r)))
        const partialIds = rows
            .filter(r => existingMap.has(dedupKey(r)))
            .map(r => existingMap.get(dedupKey(r))!)

        // ── Step 1: Insert new income_transactions as approved ────────────────
        let freshIds: string[] = []

        if (newRows.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: inserted, error: insertError } = await (supabaseAdmin as any)
                .from('income_transactions')
                .insert(newRows.map(r => ({
                    ...r,
                    status:      'approved',
                    approved_by: context.userId,
                    approved_at: now,
                })))
                .select('id')
            if (insertError) throw new Error(insertError.message ?? JSON.stringify(insertError))
            freshIds = ((inserted ?? []) as Array<{ id: string }>).map(i => i.id)
        }

        // ── Step 2: Ledger entries ─────────────────────────────────────────────
        // Create for newly inserted + any orphaned rows from a previous partial run.
        const allIds = [...freshIds, ...partialIds]

        if (allIds.length > 0) {
            // Skip IDs already ledgered (orphan recovery for previous partial run)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingLedger } = await (supabaseAdmin as any)
                .from('ledger')
                .select('reference_id')
                .eq('rt_id', context.rtId)
                .eq('source', 'income')
                .in('reference_id', allIds)

            const ledgeredIds = new Set(
                ((existingLedger ?? []) as Array<{ reference_id: string }>).map(l => l.reference_id)
            )
            const needLedger = allIds.filter(id => !ledgeredIds.has(id))

            if (needLedger.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: toledger } = await (supabaseAdmin as any)
                    .from('income_transactions')
                    .select('id, amount')
                    .in('id', needLedger)

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: lastLedger } = await (supabaseAdmin as any)
                    .from('ledger')
                    .select('balance_after')
                    .eq('rt_id', context.rtId)
                    .order('date', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                let runningBalance = (lastLedger as { balance_after: number } | null)?.balance_after ?? 0
                const ledgerRows = ((toledger ?? []) as Array<{ id: string; amount: number }>).map(inc => {
                    runningBalance += inc.amount
                    return {
                        rt_id:         context.rtId,
                        type:          'pemasukan',
                        source:        'income',
                        reference_id:  inc.id,
                        date:          now,
                        description:   'Pemasukan warga',
                        amount:        inc.amount,
                        balance_after: runningBalance,
                        created_by:    context.userId,
                    }
                })

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: ledgerError } = await (supabaseAdmin as any).from('ledger').insert(ledgerRows)
                if (ledgerError) throw new Error(ledgerError.message ?? JSON.stringify(ledgerError))
            }
        }

        // ── Step 3: Activity log ──────────────────────────────────────────────
        const { data: actor } = await supabaseAdmin
            .from('users').select('name').eq('id', context.userId).single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any)
            .from('activity_logs')
            .insert({
                rt_id:       context.rtId,
                actor_id:    context.userId,
                actor_name:  actor?.name ?? null,
                action:      'IMPORT_INCOME',
                entity_type: 'income_transactions',
                entity_id:   context.rtId,
                description: `Import ${newRows.length} pemasukan dari file (job ${context.jobId})`,
                metadata:    { inserted: newRows.length, skipped: partialIds.length, jobId: context.jobId },
            })

        return { inserted: newRows.length, skipped: partialIds.length }
    },
}
