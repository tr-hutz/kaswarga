'use client'

import { useImport } from '@/components/common/import/useImport'

const COLUMN_ALIASES = {
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
}

export function useIncomeImport(onSuccess?: (inserted: number, skipped: number) => void) {
    return useImport({
        columnAliases:     COLUMN_ALIASES,
        isValidRow:        (r: Record<string, string>) =>
            !!r.received_at?.trim() && !!r.amount?.trim() && !!r.income_name?.trim(),
        apiEndpoint:       '/api/income/import',
        templateData: [
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
        templateSheetName: 'Income',
        templateFileName:  'income-import-template.xlsx',
        onSuccess: (inserted, skipped) => onSuccess?.(inserted, skipped ?? 0),
    })
}
