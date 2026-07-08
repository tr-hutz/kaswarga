// @ts-nocheck
'use client'

import { useImport } from '@/components/import/useImport'

const COLUMN_ALIASES = {
    tanggal:     'tanggal',
    tgl:         'tanggal',
    date:        'tanggal',
    kategori:    'kategori',
    category:    'kategori',
    nominal:     'nominal',
    jumlah:      'nominal',
    amount:      'nominal',
    biaya:       'nominal',
    penerima:    'penerima',
    mitra:       'penerima',
    vendor:      'penerima',
    recipient:   'penerima',
    deskripsi:   'deskripsi',
    keterangan:  'deskripsi',
    description: 'deskripsi',
    ket:         'deskripsi',
}

export function useExpenseImport(onSuccess) {
    return useImport({
        columnAliases:     COLUMN_ALIASES,
        isValidRow:        r => !!r.tanggal?.trim() && !!r.nominal?.trim(),
        apiEndpoint:       '/api/expenses/import',
        templateData: [
            { tanggal: '2026-07-03', kategori: 'Operasional', nominal: '150000', penerima: 'Toko Bangunan Jaya', deskripsi: 'Pembelian cat pagar' },
            { tanggal: '2026-07-05', kategori: 'Kebersihan',  nominal: '75000',  penerima: 'Pak Budi',           deskripsi: 'Biaya kebersihan lingkungan' },
            { tanggal: '2026-07-10', kategori: 'Keamanan',    nominal: '200000', penerima: 'Pak Satpam',         deskripsi: 'Honor keamanan Juli' },
        ],
        templateSheetName: 'Pengeluaran',
        templateFileName:  'template-import-pengeluaran.xlsx',
        onSuccess,
    })
}