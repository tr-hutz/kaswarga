'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useToast } from '@/components/ui/ToastProvider'

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
    entityLabel,
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
    entityLabel: string
    onSuccess?: (inserted: number, skipped?: number) => void
}) {
    const { toast, dismiss } = useToast()
    const normalizeKey = makeNormalizer(columnAliases)

    const [open,     setOpen]     = useState(false)
    const [rows,     setRows]     = useState<Record<string, string>[]>([])
    const [fileName, setFileName] = useState('')
    const [error,    setError]    = useState('')
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

        const count    = valid.length
        const snapshot = [...valid]

        // Close modal immediately — API call happens in the background
        setOpen(false)
        reset()

        const processingId = toast({
            type:     'info',
            message:  `Sedang memproses ${count} ${entityLabel}...`,
            duration: 0,
        })

        try {
            const res = await fetch(apiEndpoint, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ rows: snapshot }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Import failed')

            dismiss(processingId)

            const inserted = body.inserted ?? 0
            const skipped  = body.skipped  ?? 0
            const skipMsg  = skipped > 0 ? `, ${skipped} dilewati` : ''
            toast({
                type:     'success',
                message:  `Impor data '${entityLabel}' selesai: ${inserted}/${count}${skipMsg}`,
                duration: 6000,
            })

            onSuccess?.(inserted, skipped)
        } catch (err) {
            dismiss(processingId)
            toast({
                type:     'error',
                message:  `Impor gagal: ${(err as Error).message}`,
                duration: 6000,
            })
        }
    }

    return {
        importOpen: open,
        openImport,
        closeImport,
        rows,
        fileName,
        fileRef,
        error,
        handleFile,
        handleImport,
        downloadTemplate,
        resetImport: reset,
    }
}
