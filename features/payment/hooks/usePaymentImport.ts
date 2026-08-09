'use client'

import { useJobImport } from '@/components/common/import/useJobImport'
import { IMPORT_TYPE }  from '@/lib/import/types'

const COLUMN_ALIASES: Record<string, string> = {
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
}

function isValidRow(r: Record<string, string>) {
    return (
        !!r.block?.trim() &&
        !!r.house_number?.trim() &&
        !!r.year?.trim() &&
        !!r.month?.trim() &&
        !!r.amount?.trim()
    )
}

export function usePaymentImport(onJobCreated?: (jobId: string) => void) {
    return useJobImport({
        importType:        IMPORT_TYPE.PAYMENT,
        columnAliases:     COLUMN_ALIASES,
        isValidRow,
        templateData: [
            { blok: 'A', nomor_rumah: '1', tahun: '2026', bulan: '1', jumlah: '150000' },
            { blok: 'A', nomor_rumah: '1', tahun: '2026', bulan: '2', jumlah: '150000' },
            { blok: 'B', nomor_rumah: '5', tahun: '2026', bulan: '1', jumlah: '150000' },
            { blok: 'B', nomor_rumah: '5', tahun: '2026', bulan: '2', jumlah: '150000' },
        ],
        templateSheetName: 'Pembayaran',
        templateFileName:  'payment-import-template.xlsx',
        onJobCreated,
    })
}
