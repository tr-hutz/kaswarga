'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

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

function normalizeKey(raw) {
    const slug = raw
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    return COLUMN_ALIASES[slug] ?? slug
}

function parseWorkbook(workbook) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw   = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    return raw.map(row => {
        const out = {}
        for (const [k, v] of Object.entries(row)) {
            out[normalizeKey(k)] = String(v).trim()
        }
        return out
    })
}

export function useWargaImport(onSuccess) {

    const [open,      setOpen]      = useState(false)
    const [rows,      setRows]      = useState([])
    const [fileName,  setFileName]  = useState('')
    const [importing, setImporting] = useState(false)
    const [error,     setError]     = useState('')
    const fileRef = useRef(null)

    function openImport()  { setOpen(true) }

    function closeImport() {
        setOpen(false)
        reset()
    }

    function reset() {
        setRows([])
        setFileName('')
        setError('')
        if (fileRef.current) fileRef.current.value = ''
    }

    function handleFile(file) {
        if (!file) return
        setError('')
        const reader = new FileReader()
        reader.onload = e => {
            try {
                const wb     = XLSX.read(e.target.result, { type: 'array' })
                const parsed = parseWorkbook(wb)
                if (parsed.length === 0) {
                    setError('File tidak memiliki data.')
                    return
                }
                setRows(parsed)
                setFileName(file.name)
            } catch {
                setError('Gagal membaca file. Pastikan format CSV atau Excel yang valid.')
            }
        }
        reader.readAsArrayBuffer(file)
    }

    function downloadTemplate() {
        const ws = XLSX.utils.json_to_sheet([
            { nama: 'Budi Santoso', blok: 'A',    no_rumah: '1',  no_hp: '08123456789' },
            { nama: 'Siti Rahma',   blok: 'B',    no_rumah: '5',  no_hp: ''            },
            { nama: 'Ahmad Fauzi',  blok: '',      no_rumah: '12', no_hp: '08987654321' },
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Warga')
        XLSX.writeFile(wb, 'template-import-warga.xlsx')
    }

    async function handleImport() {
        const valid = rows.filter(r => r.nama?.trim())
        if (!valid.length) {
            setError('Tidak ada data valid untuk diimpor. Pastikan kolom "nama" terisi.')
            return
        }

        setImporting(true)
        setError('')

        try {
            const res = await fetch('/api/warga/import', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ rows: valid }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Import gagal')
            closeImport()
            onSuccess(body.inserted)
        } catch (err) {
            setError(err.message)
        } finally {
            setImporting(false)
        }
    }

    return {
        importOpen: open,
        openImport,
        closeImport,
        rows,
        fileName,
        fileRef,
        importing,
        error,
        handleFile,
        handleImport,
        downloadTemplate,
        resetImport: reset,
    }
}