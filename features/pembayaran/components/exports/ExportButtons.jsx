'use client'

import {

    exportToExcel,

    exportToCSV

} from '../../../../lib/export/export-utils'

import {

    transformPaymentExport

} from '../../../../lib/services/payment-export-transform'

export default function ExportButtons({

                                          rows = []

                                      }) {

    /*
     |---------------------------------------------------------
     | EXPORT DATA
     |---------------------------------------------------------
     */

    function getExportData() {

        return transformPaymentExport(
            rows
        )
    }

    /*
     |---------------------------------------------------------
     | EXCEL
     |---------------------------------------------------------
     */

    function handleExcel() {

        exportToExcel({

            data:
                getExportData(),

            fileName:
                `pembayaran.xlsx`,

            sheetName:
                'Pembayaran'
        })
    }

    /*
     |---------------------------------------------------------
     | CSV
     |---------------------------------------------------------
     */

    function handleCSV() {

        exportToCSV({

            data:
                getExportData(),

            fileName:
                `pembayaran.csv`
        })
    }

    /*
     |---------------------------------------------------------
     | RENDER
     |---------------------------------------------------------
     */

    return (

        <div
            className="
                flex
                items-center
                gap-3
            "
        >

            <button
                onClick={handleExcel}
                className="
                    px-4
                    py-2
                    rounded-xl
                    bg-emerald-600
                    text-white
                    text-sm
                    font-medium
                    hover:bg-emerald-700
                "
            >
                Export Excel
            </button>

            <button
                onClick={handleCSV}
                className="
                    px-4
                    py-2
                    rounded-xl
                    bg-slate-800
                    text-white
                    text-sm
                    font-medium
                    hover:bg-slate-900
                "
            >
                Export CSV
            </button>

        </div>
    )
}