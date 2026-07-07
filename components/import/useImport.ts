// @ts-nocheck
'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

function makeNormalizer(aliases) {
    return function normalizeKey(raw) {
        const slug = raw
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
        return aliases[slug] ?? slug
    }
}

function parseWorkbook(workbook, normalizeKey) {
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

export function useImport({
    columnAliases = {},
    isValidRow,
    apiEndpoint,
    templateData,
    templateSheetName = 'Data',
    templateFileName,
    onSuccess,
}) {
    const normalizeKey = makeNormalizer(columnAliases)

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
                const parsed = parseWorkbook(wb, normalizeKey)
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
        const ws = XLSX.utils.json_to_sheet(templateData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, templateSheetName)
        XLSX.writeFile(wb, templateFileName)
    }

    async function handleImport() {
        const valid = rows.filter(isValidRow)
        if (!valid.length) {
            setError('Tidak ada data valid untuk diimpor.')
            return
        }

        setImporting(true)
        setError('')

        try {
            const res = await fetch(apiEndpoint, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ rows: valid }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Import gagal')
            closeImport()
            onSuccess?.(body.inserted)
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
