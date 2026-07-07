// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function ExportButtons({

                                          data = [],
                                          onExportExcel,
                                          onExportCSV

                                      }) {

    const t = useTranslations('common')

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
                {t('actions.exportExcel')}
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
                {t('actions.exportCsv')}
            </button>

        </div>
    )
}