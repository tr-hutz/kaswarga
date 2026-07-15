// @ts-nocheck
'use client'

import { useImport } from '@/components/common/import/useImport'

const COLUMN_ALIASES = {
    nama:          'name',
    nama_lengkap:  'name',
    namawarga:     'name',
    name:          'name',
    blok:          'block',
    jalan:         'block',
    blok_jalan:    'block',
    block:         'block',
    no_rumah:      'house_number',
    nomor_rumah:   'house_number',
    nomorumah:     'house_number',
    rumah:         'house_number',
    house_number:  'house_number',
    no_hp:         'phone',
    nohp:          'phone',
    hp:            'phone',
    telepon:       'phone',
    telp:          'phone',
    no_telp:       'phone',
    no_telepon:    'phone',
    phone:         'phone',
}

export function useResidentImport(onSuccess) {
    return useImport({
        columnAliases:     COLUMN_ALIASES,
        isValidRow:        r => !!r.name?.trim(),
        apiEndpoint:       '/api/residents/import',
        templateData: [
            { name: 'Budi Santoso', block: 'A',  house_number: '1',  phone: '08123456789' },
            { name: 'Siti Rahma',   block: 'B',  house_number: '5',  phone: ''            },
            { name: 'Ahmad Fauzi',  block: '',   house_number: '12', phone: '08987654321' },
        ],
        templateSheetName: 'Residents',
        templateFileName:  'resident-import-template.xlsx',
        onSuccess,
    })
}
