'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

function makeNormalizer(aliases: Record<string, string>) {
    return function normalizeKey(raw: string) {
        const slug = raw
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
        return aliases[slug] ?? slug
    }
}

function parseWorkbook(workbook: XLSX.WorkBook, normalizeKey: (k: string) => string) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw   = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]
    return raw.map(row => {
        const out: Record<string, string> = {}
        for (const [k, v] of Object.entries(row)) {
            out[normalizeKey(k)] = String(v).trim()
        }
        return out
    })
}

export function useImport({
    columnAliases = {} as Record<string, string>,
    isValidRow,
    apiEndpoint,
    templateData,
    templateSheetName = 'Data',
    templateFileName,
    onSuccess,
}: {
    columnAliases?: Record<string, string>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isValidRow: (row: any) => boolean
    apiEndpoint: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    templateData: any[]
    templateSheetName?: string
    templateFileName: string
    onSuccess?: (inserted: number, skipped?: number) => void
}) {
    const normalizeKey = makeNormalizer(columnAliases)

    const [open,      setOpen]      = useState(false)
    const [rows,      setRows]      = useState<Record<string, string>[]>([])
    const [fileName,  setFileName]  = useState('')
    const [importing, setImporting] = useState(false)
    const [error,     setError]     = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

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

    function handleFile(file: File | null | undefined) {
        if (!file) return
        setError('')
        const reader = new FileReader()
        reader.onload = e => {
            try {
                const wb     = XLSX.read(e.target?.result, { type: 'array' })
                const parsed = parseWorkbook(wb, normalizeKey)
                if (parsed.length === 0) {
                    setError('File has no data.')
                    return
                }
                setRows(parsed)
                setFileName(file.name)
            } catch {
                setError('Failed to read file. Ensure it is a valid CSV or Excel format.')
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
            setError('No valid rows to import.')
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
            if (!res.ok) throw new Error(body.error || 'Import failed')
            closeImport()
            onSuccess?.(body.inserted, body.skipped)
        } catch (err) {
            setError((err as Error).message)
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
