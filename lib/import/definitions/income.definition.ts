/*
 * Income Import Definition
 *
 * Business rules for importing income transactions.
 * Preserves existing income import behaviour.
 *
 * Approval policy: BATCH — imported income enters PENDING_APPROVAL.
 * The approver (RT_CHAIR) commits via the approve endpoint.
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
    status:           'pending'
    created_by:       string
}

/* -------------------------------------------------------------------------- */
/* Preloaded context (existing income for dedup)                              */
/* -------------------------------------------------------------------------- */

interface IncomePreloaded {
    existingSet: Set<string>  // `${name.lower}:${received_at}:${amount}`
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
        return {
            rt_id:            context.rtId,
            income_name:      row.income_name.trim(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            income_category:  (row.income_category?.trim() || 'OTHER') as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source_type:      (row.source_type?.trim()     || 'ANONYMOUS') as any,
            payer_name:       row.payer_name?.trim()       || null,
            is_anonymous:     !row.source_type?.trim() || row.source_type.trim() === 'ANONYMOUS',
            amount,
            received_at:      row.received_at.trim(),
            payment_method:   row.payment_method?.trim()   || null,
            reference_number: row.reference_number?.trim() || null,
            notes:            row.notes?.trim()            || null,
            status:           'pending',
            created_by:       context.userId,
        }
    },

    async persist(rows: IncomePayload[], context: ImportContext): Promise<PersistResult> {
        if (rows.length === 0) return { inserted: 0, skipped: 0 }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseAdmin as any)
            .from('income_transactions')
            .insert(rows)
            .select('id')

        if (error) throw error

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
                description: `Import ${(data as unknown[]).length} data pemasukan (import job ${context.jobId})`,
                metadata:    { inserted: (data as unknown[]).length, jobId: context.jobId },
            })

        // Notify CHAIR for approval
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: chairs } = await (supabaseAdmin as any)
            .from('memberships')
            .select('user_id')
            .eq('rt_id', context.rtId)
            .eq('role', 'CHAIR')
            .eq('status', 'active')

        if (chairs?.length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin as any)
                .from('notifications')
                .insert(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (chairs as any[]).map(m => ({
                        rt_id:          context.rtId,
                        type:           'income_pending',
                        title:          'Pemasukan Baru Menunggu Persetujuan',
                        message:        `${(data as unknown[]).length} data pemasukan diimpor dan menunggu persetujuan Anda.`,
                        entity_type:    'import_jobs',
                        entity_id:      context.jobId,
                        target_user_id: m.user_id,
                    }))
                )
        }

        return { inserted: (data as unknown[]).length, skipped: 0 }
    },
}
