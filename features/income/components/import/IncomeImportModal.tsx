'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { RefObject }   from 'react'
import { useTranslations }  from 'next-intl'
import ImportModal          from '@/components/common/import/ImportModal'

const COLUMNS = [
    { key: 'received_at',     label: 'received_at' },
    { key: 'income_name',     label: 'income_name' },
    { key: 'income_category', label: 'income_category' },
    { key: 'amount',          label: 'amount' },
    { key: 'source_type',     label: 'source_type' },
    { key: 'payer_name',      label: 'payer_name' },
    { key: 'payment_method',  label: 'payment_method' },
    { key: 'notes',           label: 'notes' },
]

interface IncomeImportModalProps {
    open:               boolean
    onClose:            () => void
    rows:               any[]
    fileName:           string | null
    fileRef:            RefObject<HTMLInputElement>
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

export default function IncomeImportModal({
    open, onClose, rows, fileName, fileRef, importing, error,
    onFile, onImport, onDownloadTemplate, onReset,
    progress, processedRows, totalRows,
}: IncomeImportModalProps) {
    const t = useTranslations('income')

    const columnGuide = (
        <>
            <span className="font-mono bg-canvas px-1 rounded">received_at</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">income_name</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">amount</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">income_category</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">source_type</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-canvas px-1 rounded">payment_method</span>
        </>
    )

    return (
        <ImportModal
            open={open}
            title={t('import.title')}
            onClose={onClose}
            columns={COLUMNS}
            isValid={r => !!r.received_at?.trim() && !!r.amount?.trim() && !!r.income_name?.trim()}
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
