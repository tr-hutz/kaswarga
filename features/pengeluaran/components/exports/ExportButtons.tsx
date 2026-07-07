// @ts-nocheck
'use client'

export default function ExportButtons({

                                          data = [],
                                          onExportExcel,
                                          onExportCSV

                                      }) {

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
                Export Excel
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
                Export CSV
            </button>

        </div>
    )
}