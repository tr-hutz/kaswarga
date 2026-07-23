'use client'

import ExportDropdown from '@/components/ui/ExportDropdown'

export default function ToolbarExport({
    onExportCSV,
    onExportExcel,
}: {
    onExportCSV?:   () => void
    onExportExcel?: () => void
}) {
    return (
        <ExportDropdown
            onExportExcel={onExportExcel ?? (() => {})}
            onExportCSV={onExportCSV ?? (() => {})}
        />
    )
}
