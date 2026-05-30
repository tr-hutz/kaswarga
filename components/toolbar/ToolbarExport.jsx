'use client'

import {
    Download
} from 'lucide-react'

export default function ToolbarExport({

                                          onExportCSV,
                                          onExportExcel

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

                <Download size={16} />

                <span>
                    CSV
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

                <Download size={16} />

                <span>
                    Excel
                </span>

            </button>

        </div>
    )
}