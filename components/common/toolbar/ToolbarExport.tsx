'use client'

import Icon from '@/components/ui/Icon'

import { useTranslations } from 'next-intl'

export default function ToolbarExport({

                                          onExportCSV,
                                          onExportExcel

                                      }: {
    onExportCSV?: () => void
    onExportExcel?: () => void
}) {

    const t = useTranslations('common.actions')

    return (

        <div
            className="
                flex
                items-center
                gap-2
            "
        >

            <button
                onClick={onExportCSV}
                className="
                    h-11
                    px-4
                    rounded-2xl
                    border
                    bg-white

                    flex
                    items-center
                    gap-2

                    hover:bg-gray-50
                    transition
                "
            >

                <Icon name="download" size={16} />

                <span>
                    {t('exportCsv')}
                </span>

            </button>

            <button
                onClick={onExportExcel}
                className="
                    h-11
                    px-4
                    rounded-2xl
                    border
                    bg-white

                    flex
                    items-center
                    gap-2

                    hover:bg-gray-50
                    transition
                "
            >

                <Icon name="download" size={16} />

                <span>
                    {t('exportExcel')}
                </span>

            </button>

        </div>
    )
}
