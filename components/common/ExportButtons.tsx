'use client'

import { useTranslations } from 'next-intl'

interface Props {
    onExportCSV: () => void
    onExportExcel: () => void
}

export default function ExportButtons({ onExportCSV, onExportExcel }: Props) {
    const t = useTranslations('common.actions')
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onExportExcel}
                className="px-4 py-2 rounded-xl border text-sm bg-white hover:bg-slate-50"
            >
                {t('exportExcel')}
            </button>
            <button
                onClick={onExportCSV}
                className="px-4 py-2 rounded-xl border text-sm bg-white hover:bg-slate-50"
            >
                {t('exportCsv')}
            </button>
        </div>
    )
}
