// @ts-nocheck
'use client'

import ImportModal from '@/components/import/ImportModal'

const COLUMNS = [
    { key: 'tanggal',  label: 'Tanggal' },
    { key: 'kategori', label: 'Kategori' },
    { key: 'nominal',  label: 'Nominal' },
    { key: 'penerima', label: 'Penerima' },
    { key: 'deskripsi',label: 'Deskripsi' },
]

const COLUMN_GUIDE = (
    <>
        <span className="font-mono bg-gray-100 px-1 rounded">tanggal</span> (wajib){' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">nominal</span> (wajib){' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">kategori</span>{' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">penerima</span>{' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">deskripsi</span>
    </>
)

export default function PengeluaranImportModal({
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
    return (
        <ImportModal
            open={open}
            title="Import Data Pengeluaran"
            onClose={onClose}
            columns={COLUMNS}
            isValid={r => !!r.tanggal?.trim() && !!r.nominal?.trim()}
            columnGuideText={COLUMN_GUIDE}
            rows={rows}
            fileName={fileName}
            fileRef={fileRef}
            importing={importing}
            error={error}
            onFile={onFile}
            onImport={onImport}
            onDownloadTemplate={onDownloadTemplate}
            onReset={onReset}
            importButtonLabel="Pengeluaran"
        />
    )
}