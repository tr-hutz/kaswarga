'use client'

import { useState, useRef }             from 'react'
import ExcelJS                           from 'exceljs'
import { useToast }                      from '@/components/ui/ToastProvider'
import { useImportNotifications }        from '@/components/import/ImportNotificationContext'
import type { ImportType, RawRow }       from '@/lib/import/types'

/*
|--------------------------------------------------------------------------
| useJobImport
|
| Drop-in replacement for useImport that routes submissions through the
| shared import framework (POST /api/import) instead of domain-specific
| endpoints.  The dialog closes immediately after the job is created;
| progress is tracked via the global ImportNotifications panel.
|--------------------------------------------------------------------------
*/

function makeNormalizer(aliases: Record<string, string>) {
    return (raw: string) =>
        aliases[
            raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
        ] ?? raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function cellToString(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return ''
    if (value instanceof Date) return value.toISOString().split('T')[0]
    if (typeof value === 'object') {
        if ('text'   in value) return String((value as { text: unknown }).text)
        if ('result' in value) return String((value as { result?: unknown }).result ?? '')
    }
    return String(value)
}

async function parseXLSX(buffer: ArrayBuffer, normalizeKey: (k: string) => string): Promise<RawRow[]> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]
    if (!sheet) return []
    const result: RawRow[] = []
    let headers: string[] = []
    sheet.eachRow((row, rowNumber) => {
        const vals = row.values as ExcelJS.CellValue[]
        if (rowNumber === 1) {
            headers = vals.slice(1).map(v => cellToString(v).trim())
        } else {
            const obj: RawRow = {}
            headers.forEach((h, i) => { obj[normalizeKey(h)] = cellToString(vals[i + 1]).trim() })
            result.push(obj)
        }
    })
    return result
}

function parseCSV(text: string, normalizeKey: (k: string) => string): RawRow[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
        const obj: RawRow = {}
        headers.forEach((h, i) => { obj[normalizeKey(h)] = values[i] ?? '' })
        return obj
    })
}

export function useJobImport({
    importType,
    columnAliases = {},
    isValidRow,
    templateData,
    templateSheetName = 'Data',
    templateFileName,
    onJobCreated,
}: {
    importType:         ImportType
    columnAliases?:     Record<string, string>
    isValidRow:         (row: RawRow) => boolean
    templateData:       RawRow[]
    templateSheetName?: string
    templateFileName:   string
    onJobCreated?:      (jobId: string) => void
}) {
    const { toast }    = useToast()
    const { trackJob } = useImportNotifications()
    const normalizeKey = makeNormalizer(columnAliases)

    const [open,      setOpen]      = useState(false)
    const [rows,      setRows]      = useState<RawRow[]>([])
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
        setImporting(false)
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
                const parsed = isCSV
                    ? parseCSV(result as string, normalizeKey)
                    : await parseXLSX(result as ArrayBuffer, normalizeKey)
                if (parsed.length === 0) { setError('File tidak memiliki data.'); return }
                setRows(parsed)
                setFileName(file.name)
            } catch {
                setError('Gagal membaca file. Pastikan format CSV atau Excel valid.')
            }
        }
        if (isCSV) reader.readAsText(file)
        else       reader.readAsArrayBuffer(file)
    }

    async function downloadTemplate() {
        const workbook = new ExcelJS.Workbook()
        const sheet    = workbook.addWorksheet(templateSheetName)
        if (templateData.length > 0) {
            sheet.addRow(Object.keys(templateData[0]))
            templateData.forEach(row => sheet.addRow(Object.values(row).map(v => v ?? '')))
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
        if (!valid.length) { setError('Tidak ada baris valid untuk diimpor.'); return }

        setImporting(true)
        setError('')

        try {
            const res = await fetch('/api/import', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    type:     importType,
                    rows:     valid,
                    filename: fileName || 'import.xlsx',
                    fileSize: null,
                    fileType: null,
                }),
            })
            const contentType = res.headers.get('content-type') ?? ''
            const body = contentType.includes('application/json') ? await res.json() : {}
            if (!res.ok) throw new Error(body.error || `Server error ${res.status}`)

            const jobId: string = body.jobId
            closeImport()
            trackJob(jobId)
            onJobCreated?.(jobId)

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
        // No progress/totalRows — progress tracked globally
        progress:      0,
        processedRows: 0,
        totalRows:     0,
        handleFile,
        handleImport,
        downloadTemplate,
        resetImport: reset,
    }
}
