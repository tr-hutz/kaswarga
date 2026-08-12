'use client'

import { useJobImport } from '@/components/common/import/useJobImport'
import { IMPORT_TYPE }  from '@/lib/import/types'

const COLUMN_ALIASES: Record<string, string> = {
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

function isValidRow(r: Record<string, string>) {
    return !!r.date?.trim() && !!r.amount?.trim()
}

export function useExpenseImport(onJobCreated?: (jobId: string) => void) {
    return useJobImport({
        importType:        IMPORT_TYPE.EXPENSE,
        columnAliases:     COLUMN_ALIASES,
        isValidRow,
        templateData: [
            { date: '2026-07-03', category: 'Operasional', amount: '150000', recipient: 'Toko Bangunan Jaya', description: 'Pembelian cat pagar' },
            { date: '2026-07-05', category: 'Kebersihan',  amount: '75000',  recipient: 'Pak Budi',           description: 'Biaya kebersihan lingkungan' },
            { date: '2026-07-10', category: 'Keamanan',    amount: '200000', recipient: 'Pak Satpam',         description: 'Honor keamanan Juli' },
        ],
        templateSheetName: 'Expenses',
        templateFileName:  'expense-import-template.xlsx',
        onJobCreated,
    })
}
