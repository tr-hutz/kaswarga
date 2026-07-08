// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import ImportModal from '@/components/import/ImportModal'

const COLUMNS = [
    { key: 'tanggal',   label: 'Tanggal' },
    { key: 'kategori',  label: 'Kategori' },
    { key: 'nominal',   label: 'Nominal' },
    { key: 'penerima',  label: 'Penerima' },
    { key: 'deskripsi', label: 'Deskripsi' },
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
    const t = useTranslations('pengeluaran')

    const columnGuide = (
        <>
            <span className="font-mono bg-gray-100 px-1 rounded">tanggal</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">nominal</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">kategori</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">penerima</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">deskripsi</span>
        </>
    )

    return (
        <ImportModal
            open={open}
            title={t('import.title')}
            onClose={onClose}
            columns={COLUMNS}
            isValid={r => !!r.tanggal?.trim() && !!r.nominal?.trim()}
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
