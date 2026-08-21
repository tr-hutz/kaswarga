/*
 * clientTemplates.ts
 *
 * Client-safe module configuration for the centralized import dialog.
 * Does NOT import supabaseAdmin — safe to use in browser components.
 *
 * Template data mirrors the definitions in lib/import/definitions/*.
 * Update both when column schemas change.
 */

import { PERMISSION, type Permission } from '@/lib/auth/types'
import { IMPORT_TYPE, type ImportType, type RawRow } from './types'

export interface ClientModuleConfig {
    label:             string
    importPermission:  Permission
    approvePermission: Permission | null
    columnAliases:     Record<string, string>
    sampleRows:        Record<string, string>[]
    sheetName:         string
    fileName:          string
    isValidRow:        (row: RawRow) => boolean
}

export const CLIENT_MODULE_CONFIGS: Record<ImportType, ClientModuleConfig> = {

    [IMPORT_TYPE.RESIDENT]: {
        label:             'Warga',
        importPermission:  PERMISSION.RESIDENT_IMPORT,
        approvePermission: null,
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
        isValidRow: (row) => !!row.name?.trim(),
    },

    [IMPORT_TYPE.PAYMENT]: {
        label:             'Pembayaran',
        importPermission:  PERMISSION.PAYMENT_IMPORT,
        approvePermission: PERMISSION.PAYMENT_IMPORT_APPROVE,
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
        isValidRow: (row) =>
            !!row.block?.trim() &&
            !!row.house_number?.trim() &&
            !!row.year?.trim() &&
            !!row.month?.trim() &&
            !!row.amount?.trim(),
    },

    [IMPORT_TYPE.INCOME]: {
        label:             'Pemasukan',
        importPermission:  PERMISSION.INCOME_IMPORT,
        approvePermission: PERMISSION.INCOME_APPROVE,
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
        isValidRow: (row) =>
            !!row.received_at?.trim() &&
            !!row.income_name?.trim() &&
            !!row.amount?.trim(),
    },

    [IMPORT_TYPE.EXPENSE]: {
        label:             'Pengeluaran',
        importPermission:  PERMISSION.EXPENSE_IMPORT,
        approvePermission: PERMISSION.EXPENSE_APPROVE,
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
        isValidRow: (row) =>
            !!row.date?.trim() &&
            !!row.amount?.trim(),
    },
}
