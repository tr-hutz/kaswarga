'use client'

import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
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

function cellToString(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return ''
    if (value instanceof Date) return value.toISOString().split('T')[0]
    if (typeof value === 'object') {
        if ('text' in value) return String((value as { text: unknown }).text)
        if ('result' in value) return String((value as { result?: unknown }).result ?? '')
    }
    return String(value)
}

async function parseXLSX(
    buffer: ArrayBuffer,
    normalizeKey: (k: string) => string
): Promise<Record<string, string>[]> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]
    if (!sheet) return []

    const result: Record<string, string>[] = []
    let headers: string[] = []

    sheet.eachRow((row, rowNumber) => {
        const vals = row.values as ExcelJS.CellValue[]
        // row.values is 1-indexed; index 0 is always undefined
        if (rowNumber === 1) {
            headers = vals.slice(1).map(v => cellToString(v).trim())
        } else {
            const obj: Record<string, string> = {}
            headers.forEach((h, i) => {
                obj[normalizeKey(h)] = cellToString(vals[i + 1]).trim()
            })
            result.push(obj)
        }
    })

    return result
}

function parseCSV(
    text: string,
    normalizeKey: (k: string) => string
): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[normalizeKey(h)] = values[i] ?? '' })
        return obj
    })
}

export function useImport({
    columnAliases = {} as Record<string, string>,
    isValidRow,
    apiEndpoint,
    templateData,
    templateSheetName = 'Data',
    templateFileName,
    batchSize = 150,
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
    batchSize?: number
    onSuccess?: (inserted: number, skipped?: number) => void
}) {
    const { toast, dismiss } = useToast()
    const normalizeKey = makeNormalizer(columnAliases)

    const [open,          setOpen]          = useState(false)
    const [rows,          setRows]          = useState<Record<string, string>[]>([])
    const [fileName,      setFileName]      = useState('')
    const [importing,     setImporting]     = useState(false)
    const [error,         setError]         = useState('')
    const [progress,      setProgress]      = useState(0)
    const [processedRows, setProcessedRows] = useState(0)
    const [totalRows,     setTotalRows]     = useState(0)
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
        setImporting(false)
        setProgress(0)
        setProcessedRows(0)
        setTotalRows(0)
        if (fileRef.current) fileRef.current.value = ''
    }

    function handleFile(file: File | null | undefined) {
        if (!file) return
        setError('')
        const isCSV = file.name.toLowerCase().endsWith('.csv')
        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const result = e.target?.result
                if (result === undefined || result === null) return
                let parsed: Record<string, string>[]
                if (isCSV) {
                    parsed = parseCSV(result as string, normalizeKey)
                } else {
                    parsed = await parseXLSX(result as ArrayBuffer, normalizeKey)
                }
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
        if (isCSV) {
            reader.readAsText(file)
        } else {
            reader.readAsArrayBuffer(file)
        }
    }

    async function downloadTemplate() {
        const workbook = new ExcelJS.Workbook()
        const sheet    = workbook.addWorksheet(templateSheetName)
        if (templateData.length > 0) {
            sheet.addRow(Object.keys(templateData[0]))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            templateData.forEach((row: any) =>
                sheet.addRow(Object.values(row).map((v: unknown) => v ?? ''))
            )
        }
        const buffer = await workbook.xlsx.writeBuffer()
        const blob   = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url  = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href     = url
        link.download = templateFileName
        link.click()
        URL.revokeObjectURL(url)
    }

    async function handleImport() {
        const valid = rows.filter(isValidRow)
        if (!valid.length) {
            setError('No valid rows to import.')
            return
        }

        setImporting(true)
        setError('')
        setProgress(0)
        setProcessedRows(0)
        setTotalRows(valid.length)

        const batches: typeof valid[] = []
        for (let i = 0; i < valid.length; i += batchSize) {
            batches.push(valid.slice(i, i + batchSize))
        }

        let totalInserted = 0
        let totalSkipped  = 0
        let processed     = 0

        try {
            for (const batch of batches) {
                const res = await fetch(apiEndpoint, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ rows: batch }),
                })
                const body = await res.json()
                if (!res.ok) throw new Error(body.error || 'Import failed')
                totalInserted += body.inserted ?? 0
                totalSkipped  += body.skipped  ?? 0
                processed     += batch.length
                setProcessedRows(processed)
                setProgress(Math.round((processed / valid.length) * 100))
            }
            closeImport()
            onSuccess?.(totalInserted, totalSkipped)
        } catch (err) {
            setImporting(false)
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
        importing,
        error,
        progress,
        processedRows,
        totalRows,
        handleFile,
        handleImport,
        downloadTemplate,
        resetImport: reset,
    }
}
