// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function ExportButtons({

                                          data = [],
                                          onExportExcel,
                                          onExportCSV

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
                onClick={() =>
                    onExportExcel(data)
                }
                className="
          px-4
          py-2
          rounded-xl
          border
          text-sm
          bg-white
          hover:bg-slate-50
        "
            >
                {t('exportExcel')}
            </button>

            <button
                onClick={() =>
                    onExportCSV(data)
                }
                className="
          px-4
          py-2
          rounded-xl
          border
          text-sm
          bg-white
          hover:bg-slate-50
        "
            >
                {t('exportCsv')}
            </button>

        </div>
    )
}