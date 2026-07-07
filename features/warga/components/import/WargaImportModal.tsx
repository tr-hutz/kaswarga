// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import ImportModal from '@/components/import/ImportModal'

const COLUMNS = [
    { key: 'nama',     label: 'Nama' },
    { key: 'blok',     label: 'Blok' },
    { key: 'no_rumah', label: 'No. Rumah' },
    { key: 'no_hp',    label: 'No HP' },
]

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
    const t = useTranslations('warga')

    const columnGuide = (
        <>
            <span className="font-mono bg-gray-100 px-1 rounded">nama</span> ({t('import.required')}){' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">blok</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">no_rumah</span>{' '}
            &nbsp;·&nbsp;
            <span className="font-mono bg-gray-100 px-1 rounded">no_hp</span>
        </>
    )

    return (
        <ImportModal
            open={open}
            title={t('import.title')}
            onClose={onClose}
            columns={COLUMNS}
            isValid={r => !!r.nama?.trim()}
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
