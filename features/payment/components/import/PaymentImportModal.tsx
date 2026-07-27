'use client'

import type { RefObject } from 'react'
import { useTranslations } from 'next-intl'
import ImportModal from '@/components/common/import/ImportModal'

const COLUMNS = [
    { key: 'block',        label: 'Blok' },
    { key: 'house_number', label: 'Nomor Rumah' },
    { key: 'year',         label: 'Tahun' },
    { key: 'month',        label: 'Bulan' },
    { key: 'amount',       label: 'Jumlah' },
]

interface PaymentImportModalProps {
    open:               boolean
    onClose:            () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows:               any[]
    fileName:           string | null
    fileRef:            RefObject<HTMLInputElement | null>
    importing:          boolean
    error:              string
    onFile:             (file: File | undefined) => void
    onImport:           () => void
    onDownloadTemplate: () => void
    onReset:            () => void
    progress?:          number
    processedRows?:     number
    totalRows?:         number
}

export default function PaymentImportModal({
    open, onClose, rows, fileName, fileRef,
    importing, error, onFile, onImport, onDownloadTemplate, onReset,
    progress, processedRows, totalRows,
}: PaymentImportModalProps) {
    const t = useTranslations('payments')

    const columnGuide = (
        <>
            <span className="font-mono bg-canvas px-1 rounded">blok</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">nomor_rumah</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">tahun</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">bulan</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">jumlah</span> ({t('import.required')})
        </>
    )

    return (
        <ImportModal
            open={open}
            title={t('import.title')}
            onClose={onClose}
            columns={COLUMNS}
            isValid={r =>
                !!r.block?.trim() &&
                !!r.house_number?.trim() &&
                !!r.year?.trim() &&
                !!r.month?.trim() &&
                !!r.amount?.trim()
            }
            columnGuideText={columnGuide}
            rows={rows}
            fileName={fileName}
            fileRef={fileRef}
            importing={importing}
            error={error}
            onFile={onFile}
            onImport={onImport}
            onDownloadTemplate={onDownloadTemplate}
            onReset={onReset}
            importButtonLabel={t('import.buttonLabel')}
            progress={progress}
            processedRows={processedRows}
            totalRows={totalRows}
        />
    )
}
