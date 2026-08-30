'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }                from 'react'
import { useTranslations }         from 'next-intl'
import { usePermission }            from '@/lib/auth/usePermission'
import { PERMISSION }               from '@/lib/auth/types'
import { IMPORT_TYPE, type ImportType, type RawRow } from '@/lib/import/types'
import { CLIENT_MODULE_CONFIGS }   from '@/lib/import/clientTemplates'
import { useJobImport }             from '@/components/common/import/useJobImport'
import Icon                         from '@/components/ui/Icon'

const ALL_TYPES: ImportType[] = [
    IMPORT_TYPE.RESIDENT,
    IMPORT_TYPE.PAYMENT,
    IMPORT_TYPE.INCOME,
    IMPORT_TYPE.EXPENSE,
]

interface Props {
    open:         boolean
    onClose:      () => void
    onJobCreated: () => void
}

export default function CentralizedImportDialog({ open, onClose, onJobCreated }: Props) {
    const t = useTranslations('importManagement.importDialog')

    const canImportResident = usePermission(PERMISSION.RESIDENT_IMPORT)
    const canImportPayment  = usePermission(PERMISSION.PAYMENT_IMPORT)
    const canImportIncome   = usePermission(PERMISSION.INCOME_IMPORT)
    const canImportExpense  = usePermission(PERMISSION.EXPENSE_IMPORT)

    const permMap: Record<ImportType, boolean> = {
        [IMPORT_TYPE.RESIDENT]: canImportResident,
        [IMPORT_TYPE.PAYMENT]:  canImportPayment,
        [IMPORT_TYPE.INCOME]:   canImportIncome,
        [IMPORT_TYPE.EXPENSE]:  canImportExpense,
    }

    const availableTypes = ALL_TYPES.filter(type => permMap[type])

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-surface rounded-t-2xl sm:rounded-xl shadow-card w-full sm:max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
                    <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-canvas text-subtle hover:text-foreground"
                    >
                        <Icon name="x" size={18} />
                    </button>
                </div>

                {availableTypes.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-muted">
                        Anda tidak memiliki akses untuk mengimpor data.
                    </div>
                ) : (
                    <ModuleSelector
                        availableTypes={availableTypes}
                        onClose={onClose}
                        onJobCreated={onJobCreated}
                    />
                )}
            </div>
        </div>
    )
}

function ModuleSelector({
    availableTypes,
    onClose,
    onJobCreated,
}: {
    availableTypes: ImportType[]
    onClose:        () => void
    onJobCreated:   () => void
}) {
    const t = useTranslations('importManagement.importDialog')
    const [selectedType, setSelectedType] = useState<ImportType | null>(null)

    return (
        <div className="p-6 space-y-5">
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('moduleLabel')}</label>
                <select
                    value={selectedType ?? ''}
                    onChange={e => setSelectedType(e.target.value as ImportType || null)}
                    className="w-full h-10 rounded-lg border border-divider bg-canvas px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">{t('modulePlaceholder')}</option>
                    {availableTypes.map(type => (
                        <option key={type} value={type}>
                            {CLIENT_MODULE_CONFIGS[type].label}
                        </option>
                    ))}
                </select>
            </div>

            {selectedType ? (
                <ModuleImportPanel
                    key={selectedType}
                    importType={selectedType}
                    onClose={onClose}
                    onJobCreated={onJobCreated}
                />
            ) : (
                <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-divider text-sm text-muted">
                    {t('noModuleSelected')}
                </div>
            )}
        </div>
    )
}

function ModuleImportPanel({
    importType,
    onClose,
    onJobCreated,
}: {
    importType:   ImportType
    onClose:      () => void
    onJobCreated: () => void
}) {
    const t      = useTranslations('importManagement.importDialog')
    const tc     = useTranslations('common')
    const config = CLIENT_MODULE_CONFIGS[importType]

    const {
        rows, fileName, fileRef, importing, error,
        handleFile, handleImport, downloadTemplate, resetImport,
    } = useJobImport({
        importType,
        columnAliases:     config.columnAliases,
        isValidRow:        config.isValidRow as (row: RawRow) => boolean,
        templateData:      config.sampleRows,
        templateSheetName: config.sheetName,
        templateFileName:  config.fileName,
        onJobCreated: () => {
            onClose()
            onJobCreated()
        },
    })

    const validRows   = rows.filter(r => config.isValidRow(r as any))
    const invalidRows = rows.filter(r => !config.isValidRow(r as any))

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">{t('fileLabel')}</label>
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <Icon name="download" size={12} />
                        Unduh Template
                    </button>
                </div>

                {!fileName ? (
                    <label className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-divider hover:border-primary cursor-pointer transition-colors bg-canvas text-center p-4">
                        <Icon name="upload" size={22} className="text-muted mb-2" />
                        <span className="text-sm text-muted">Klik untuk memilih file</span>
                        <span className="text-xs text-subtle mt-0.5">CSV atau Excel (.xlsx / .xls)</span>
                        <input
                            type="file"
                            ref={fileRef}
                            accept=".csv,.xlsx,.xls"
                            className="sr-only"
                            onChange={e => handleFile(e.target.files?.[0])}
                        />
                    </label>
                ) : (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-divider bg-canvas">
                        <div className="flex items-center gap-2">
                            <Icon name="file" size={16} className="text-primary shrink-0" />
                            <span className="text-sm text-foreground truncate">{fileName}</span>
                        </div>
                        <button
                            type="button"
                            onClick={resetImport}
                            className="text-xs text-muted hover:text-foreground shrink-0"
                        >
                            {tc('actions.change')}
                        </button>
                    </div>
                )}
            </div>

            {rows.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="text-success font-medium">✓ {validRows.length} valid</span>
                    {invalidRows.length > 0 && (
                        <span className="text-danger font-medium">✕ {invalidRows.length} tidak valid</span>
                    )}
                </div>
            )}

            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={importing}
                    className="flex-1 border border-divider rounded-lg px-4 py-2.5 text-sm hover:bg-canvas disabled:opacity-50 transition-colors"
                >
                    {tc('actions.cancel')}
                </button>
                <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || validRows.length === 0}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                    {importing && (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {validRows.length > 0
                        ? t('rowsWillImport', { count: validRows.length.toLocaleString('id-ID') })
                        : t('importButton')}
                </button>
            </div>
        </div>
    )
}
