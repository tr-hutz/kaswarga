'use client'

import { useImport } from '@/components/common/import/useImport'

const COLUMN_ALIASES = {
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
}

export function useExpenseImport(onSuccess?: (inserted: number, skipped: number) => void) {
    return useImport({
        columnAliases:     COLUMN_ALIASES,
        isValidRow:        (r: Record<string, string>) => !!r.date?.trim() && !!r.amount?.trim(),
        apiEndpoint:       '/api/expenses/import',
        templateData: [
            { date: '2026-07-03', category: 'Operasional', amount: '150000', recipient: 'Toko Bangunan Jaya', description: 'Pembelian cat pagar' },
            { date: '2026-07-05', category: 'Kebersihan',  amount: '75000',  recipient: 'Pak Budi',           description: 'Biaya kebersihan lingkungan' },
            { date: '2026-07-10', category: 'Keamanan',    amount: '200000', recipient: 'Pak Satpam',         description: 'Honor keamanan Juli' },
        ],
        templateSheetName: 'Expenses',
        templateFileName:  'expense-import-template.xlsx',
        onSuccess: (inserted, skipped) => onSuccess?.(inserted, skipped ?? 0),
    })
}