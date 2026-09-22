'use client'

import ExportDropdown from '@/components/ui/ExportDropdown'

export default function ToolbarExport({
    onExportExcel,
}: {
    onExportExcel?: () => void
}) {
    return (
        <ExportDropdown
            onExportExcel={onExportExcel ?? (() => {})}
        />
    )
}
