// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import ImportModal from '@/components/import/ImportModal'

const COLUMNS = [
    { key: 'name',         label: 'Nama' },
    { key: 'block',        label: 'Blok' },
    { key: 'house_number', label: 'No. Rumah' },
    { key: 'phone',        label: 'No HP' },
]

export default function ResidentImportModal({
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
    const t = useTranslations('residents')

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
            isValid={r => !!r.name?.trim()}
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
