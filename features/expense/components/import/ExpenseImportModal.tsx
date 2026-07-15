// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import ImportModal from '@/components/common/import/ImportModal'

const COLUMNS = [
    { key: 'date',        label: 'Date' },
    { key: 'category',    label: 'Category' },
    { key: 'amount',      label: 'Amount' },
    { key: 'recipient',   label: 'Recipient' },
    { key: 'description', label: 'Description' },
]

export default function ExpenseImportModal({
    open,
    onClose,
    rows,
    fileName,
    fileRef,
    importing,
    error,
    onFile,
    onImport,
    onDownloadTemplate,
    onReset,
}) {
    const t = useTranslations('expenses')

    const columnGuide = (
        <>
            <span className="font-mono bg-gray-100 px-1 rounded">date</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">amount</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">category</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">recipient</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">description</span>
        </>
    )

    return (
        <ImportModal
            open={open}
            title={t('import.title')}
            onClose={onClose}
            columns={COLUMNS}
            isValid={r => !!r.date?.trim() && !!r.amount?.trim()}
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
        />
    )
}
