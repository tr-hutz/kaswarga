'use client'

import { useImport } from '@/components/import/useImport'

const COLUMN_ALIASES = {
    nama:          'nama',
    nama_lengkap:  'nama',
    namawarga:     'nama',
    blok:          'blok',
    jalan:         'blok',
    blok_jalan:    'blok',
    no_rumah:      'no_rumah',
    nomor_rumah:   'no_rumah',
    nomorumah:     'no_rumah',
    rumah:         'no_rumah',
    no_hp:         'no_hp',
    nohp:          'no_hp',
    hp:            'no_hp',
    telepon:       'no_hp',
    telp:          'no_hp',
    no_telp:       'no_hp',
    no_telepon:    'no_hp',
    phone:         'no_hp',
}

export function useWargaImport(onSuccess) {
    return useImport({
        columnAliases:     COLUMN_ALIASES,
        isValidRow:        r => !!r.nama?.trim(),
        apiEndpoint:       '/api/warga/import',
        templateData: [
            { nama: 'Budi Santoso', blok: 'A',  no_rumah: '1',  no_hp: '08123456789' },
            { nama: 'Siti Rahma',   blok: 'B',  no_rumah: '5',  no_hp: ''            },
            { nama: 'Ahmad Fauzi',  blok: '',   no_rumah: '12', no_hp: '08987654321' },
        ],
        templateSheetName: 'Warga',
        templateFileName:  'template-import-warga.xlsx',
        onSuccess,
    })
}