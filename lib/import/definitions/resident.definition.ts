/*
 * Resident Import Definition
 *
 * Business rules for importing resident rows.
 * The framework handles lifecycle; this file owns dedup, validation,
 * transformation, and persistence of residents.
 *
 * Approval policy: NONE — rows are committed immediately.
 */

import { supabaseAdmin }        from '@/lib/supabase-admin'
import { PERMISSION }           from '@/lib/auth/types'
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

interface ResidentPayload {
    rt_id:        string
    name:         string
    block:        string | null
    house_number: string | null
    phone:        string | null
    active:       boolean
}

/* -------------------------------------------------------------------------- */
/* Preloaded context (existing residents for dedup)                           */
/* -------------------------------------------------------------------------- */

interface ResidentPreloaded {
    existingKeys: Set<string>  // `${block.lower}:${house.lower}`
}

/* -------------------------------------------------------------------------- */
/* Column definitions                                                          */
/* -------------------------------------------------------------------------- */

const COLUMNS: ImportColumn[] = [
    { key: 'name',         label: 'Nama',          required: true  },
    { key: 'block',        label: 'Blok',           required: false },
    { key: 'house_number', label: 'Nomor Rumah',    required: false },
    { key: 'phone',        label: 'Nomor HP',       required: false },
]

const TEMPLATE: ImportTemplate = {
    columnAliases: {
        nama:         'name',
        nama_lengkap: 'name',
        namawarga:    'name',
        name:         'name',
        blok:         'block',
        jalan:        'block',
        blok_jalan:   'block',
        block:        'block',
        no_rumah:     'house_number',
        nomor_rumah:  'house_number',
        nomorumah:    'house_number',
        rumah:        'house_number',
        house_number: 'house_number',
        no_hp:        'phone',
        nohp:         'phone',
        hp:           'phone',
        telepon:      'phone',
        telp:         'phone',
        no_telp:      'phone',
        no_telepon:   'phone',
        phone:        'phone',
    },
    sampleRows: [
        { name: 'Budi Santoso', block: 'A',  house_number: '1',  phone: '08123456789' },
        { name: 'Siti Rahma',   block: 'B',  house_number: '5',  phone: ''            },
        { name: 'Ahmad Fauzi',  block: '',   house_number: '12', phone: '08987654321' },
    ],
    sheetName: 'Residents',
    fileName:  'resident-import-template.xlsx',
}

/* -------------------------------------------------------------------------- */
/* Definition                                                                  */
/* -------------------------------------------------------------------------- */

export const residentImportDefinition: ImportDefinition<ResidentPayload> = {
    type:              IMPORT_TYPE.RESIDENT,
    importPermission:  PERMISSION.RESIDENT_IMPORT,
    approvePermission: null,
    approvalPolicy:    APPROVAL_POLICY.NONE,
    columns:           COLUMNS,
    template:          TEMPLATE,

    async preload(context: ImportContext): Promise<ResidentPreloaded> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabaseAdmin as any)
            .from('residents')
            .select('block, house_number')
            .eq('rt_id', context.rtId)

        const existingKeys = new Set<string>(
            ((data ?? []) as Array<{ block: string | null; house_number: string | null }>)
                .filter(r => r.block && r.house_number)
                .map(r => `${String(r.block).toLowerCase().trim()}:${String(r.house_number).toLowerCase().trim()}`)
        )

        return { existingKeys }
    },

    validateRow(row: RawRow, context: ImportContext): RowValidationResult {
        const { existingKeys } = context as unknown as ResidentPreloaded & ImportContext

        if (!row.name?.trim()) {
            return { valid: false, errorCode: 'MISSING_NAME', errorMessage: 'Nama warga wajib diisi' }
        }

        // Dedup check (only when both block and house_number are present)
        if (row.block?.trim() && row.house_number?.trim()) {
            const key = `${row.block.toLowerCase().trim()}:${row.house_number.toLowerCase().trim()}`
            if (existingKeys?.has(key)) {
                return {
                    valid:        false,
                    skipped:      true,
                    skipReason:   'DUPLICATE_ADDRESS',
                    errorMessage: `Blok ${row.block} No. ${row.house_number} sudah terdaftar`,
                }
            }
            // Add to set for within-batch dedup
            existingKeys?.add(key)
        }

        return { valid: true }
    },

    transform(row: RawRow, context: ImportContext): ResidentPayload {
        return {
            rt_id:        context.rtId,
            name:         row.name.trim(),
            block:        row.block?.trim()        || null,
            house_number: row.house_number?.trim() || null,
            phone:        row.phone?.trim()        || null,
            active:       true,
        }
    },

    async persist(rows: ResidentPayload[], context: ImportContext): Promise<PersistResult> {
        if (rows.length === 0) return { inserted: 0, skipped: 0 }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabaseAdmin as any)
            .from('residents')
            .insert(rows)

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
                action:      'IMPORT_RESIDENTS',
                entity_type: 'residents',
                entity_id:   context.rtId,
                description: `Import ${rows.length} data warga (import job ${context.jobId})`,
                metadata:    { inserted: rows.length, jobId: context.jobId },
            })

        return { inserted: rows.length, skipped: 0 }
    },
}
