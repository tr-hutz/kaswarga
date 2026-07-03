'use client'

import ImportModal from '@/components/import/ImportModal'

const COLUMNS = [
    { key: 'nama',     label: 'Nama' },
    { key: 'blok',     label: 'Blok' },
    { key: 'no_rumah', label: 'No. Rumah' },
    { key: 'no_hp',    label: 'No HP' },
]

const COLUMN_GUIDE = (
    <>
        <span className="font-mono bg-gray-100 px-1 rounded">nama</span> (wajib){' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">blok</span>{' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">no_rumah</span>{' '}
        &nbsp;·&nbsp;
        <span className="font-mono bg-gray-100 px-1 rounded">no_hp</span>
    </>
)

export default function WargaImportModal({
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
            title="Import Data Warga"
            onClose={onClose}
            columns={COLUMNS}
            isValid={r => !!r.nama?.trim()}
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
            importButtonLabel="Warga"
        />
    )
}