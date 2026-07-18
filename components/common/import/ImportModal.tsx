'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'
import type { ReactNode, RefObject } from 'react'

interface ImportModalProps {
    open: boolean
    title: string
    onClose: () => void
    columns: { key: string; label: string }[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isValid: (row: any) => boolean
    columnGuideText?: ReactNode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[]
    fileName: string | null
    fileRef: RefObject<HTMLInputElement>
    importing: boolean
    error: string
    onFile: (file: File | undefined) => void
    onImport: () => void
    onDownloadTemplate: () => void
    onReset: () => void
    importButtonLabel: string
}

export default function ImportModal({
    open,
    title,
    onClose,
    columns,
    isValid,
    columnGuideText,
    rows,
    fileName,
    fileRef,
    importing,
    error,
    onFile,
    onImport,
    onDownloadTemplate,
    onReset,
    importButtonLabel,
}: ImportModalProps) {

    if (!open) return null

    const t = useTranslations('import')
    const tCommon = useTranslations('common')

    const validRows   = rows.filter(isValid)
    const invalidRows = rows.filter(r => !isValid(r))
    const hasFile     = rows.length > 0

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-card w-full max-w-2xl max-h-[90vh] flex flex-col">

                <div className="flex items-center justify-between px-6 py-4 border-b border-stroke">
                    <div>
                        <h2 className="text-base font-semibold text-dark">{title}</h2>
                        <p className="text-xs text-dark-5 mt-0.5">
                            {t('format')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-body text-dark-6 hover:text-dark"
                    >
                        <Icon name="x" size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {!hasFile ? (
                        <div className="space-y-4">

                            <div className="flex items-center gap-3 p-3 bg-info/5 rounded-lg">
                                <span className="text-sm text-dark-5">
                                    {t('templateNote')}
                                </span>
                                <button
                                    type="button"
                                    onClick={onDownloadTemplate}
                                    className="flex items-center gap-1.5 text-sm text-info hover:underline whitespace-nowrap shrink-0"
                                >
                                    <Icon name="download" size={14} />
                                    {t('downloadTemplate')}
                                </button>
                            </div>

                            <label className="
                                block border-2 border-dashed border-stroke rounded-lg
                                p-12 text-center cursor-pointer
                                hover:border-primary hover:bg-primary/5 transition-colors
                            ">
                                <Icon name="upload" size={32} className="mx-auto text-dark-6 mb-3" />
                                <p className="text-sm font-medium text-dark">
                                    {t('clickToSelect')}
                                </p>
                                <p className="text-xs text-dark-6 mt-1">
                                    {t('fileFormat')}
                                </p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={e => onFile(e.target.files?.[0])}
                                />
                            </label>

                            {columnGuideText && (
                                <div className="text-xs text-dark-6 space-y-1">
                                    <p className="font-medium text-dark-5">{t('columnGuide')}</p>
                                    <p>{columnGuideText}</p>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="space-y-3">

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-dark truncate max-w-xs">
                                        {fileName}
                                    </span>
                                    <span className="text-dark-6">·</span>
                                    <span className="text-success font-medium">
                                        {validRows.length} {t('valid')}
                                    </span>
                                    {invalidRows.length > 0 && (
                                        <>
                                            <span className="text-dark-6">·</span>
                                            <span className="text-danger">
                                                {invalidRows.length} {t('skipped')}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="text-xs text-dark-6 hover:text-dark underline shrink-0"
                                >
                                    {t('changeFile')}
                                </button>
                            </div>

                            <div className="rounded-lg border border-stroke overflow-hidden">
                                <div className="overflow-auto max-h-72">
                                    <table className="w-full text-xs">
                                        <thead className="bg-body text-dark-5 uppercase tracking-wide sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left w-8 font-medium">#</th>
                                                {columns.map(col => (
                                                    <th key={col.key} className="px-3 py-2 text-left font-medium">
                                                        {col.label}
                                                    </th>
                                                ))}
                                                <th className="px-3 py-2 text-center font-medium">{t('status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stroke">
                                            {rows.map((row, i) => {
                                                const valid = isValid(row)
                                                return (
                                                    <tr
                                                        key={i}
                                                        className={valid ? 'hover:bg-body' : 'bg-danger/5'}
                                                    >
                                                        <td className="px-3 py-2 text-dark-6">{i + 1}</td>
                                                        {columns.map(col => (
                                                            <td key={col.key} className="px-3 py-2 text-dark">
                                                                {row[col.key] || (
                                                                    <span className="text-dark-6">-</span>
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2 text-center">
                                                            {valid
                                                                ? <Icon name="check-circle" size={14} className="inline text-success" />
                                                                : <Icon name="alert-circle" size={14} className="inline text-danger" />
                                                            }
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {invalidRows.length > 0 && (
                                <p className="text-xs text-danger">
                                    {t('invalidRowsNote')}
                                </p>
                            )}

                        </div>
                    )}

                    {error && (
                        <div className="bg-danger/5 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stroke">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-stroke rounded-lg px-4 py-2 text-sm text-dark-5 hover:bg-body"
                    >
                        {tCommon('actions.cancel')}
                    </button>
                    {hasFile && (
                        <button
                            type="button"
                            onClick={onImport}
                            disabled={importing || validRows.length === 0}
                            className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {importing
                                ? tCommon('states.importing')
                                : `Import ${validRows.length} ${importButtonLabel}`
                            }
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
