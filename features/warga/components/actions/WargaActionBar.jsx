'use client'

import ExportButtons
    from '../../../pembayaran/components/exports/ExportButtons'

export default function WargaActionBar({

                                           rows,

                                           onCreate

                                       }) {

    return (

        <div
            className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
            "
        >

            <div>

                <h1
                    className="
                        text-2xl
                        font-bold
                    "
                >
                    Warga
                </h1>

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    Data warga cluster
                </p>

            </div>

            <div
                className="
                    flex
                    items-center
                    gap-3
                "
            >

                <button
                    onClick={onCreate}
                    className="
                        px-4
                        py-2
                        rounded-xl
                        bg-slate-900
                        text-white
                        text-sm
                        font-medium
                    "
                >
                    Tambah Warga
                </button>

                <ExportButtons
                    rows={rows}
                />

            </div>

        </div>
    )
}