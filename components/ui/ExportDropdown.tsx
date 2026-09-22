'use client'

import { useTranslations } from 'next-intl'
import Icon from './Icon'

interface Props {
    onExportExcel: () => void
}

export default function ExportDropdown({ onExportExcel }: Props) {
    const t = useTranslations('common')

    return (
        <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground transition"
        >
            <Icon name="download" size={15} />
            {t('actions.exportExcel')}
        </button>
    )
}
