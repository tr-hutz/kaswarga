// @ts-nocheck
'use client'

import {
    X
} from 'lucide-react'

import {
    useKeyDown
} from '../../../../lib/hooks/useKeyDown'

export default function LedgerDrawer({

                                         open,
                                         row,

                                         onClose

                                     }) {

    useKeyDown(open, { Escape: onClose })

    if (!open || !row) {
        return null
    }

    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                justify-end
                bg-black/30
            "

            onClick={onClose}
        >

            <div
                className="
                    w-full
                    max-w-lg
                    bg-white
                    h-full
                    overflow-y-auto
                    p-6
                    shadow-2xl
                "
            >

                <div
                    className="
                        p-5
                        border-b
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <h2
                            className="
                                text-lg
                                font-semibold
                            "
                        >
                            Detail Ledger
                        </h2>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Detail transaksi kas
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                    >

                        <X
                            className="
                                w-5
                                h-5
                            "
                        />

                    </button>

                </div>

                <div
                    className="
                        p-5
                        space-y-5
                    "
                >

                    <div>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Jenis
                        </p>

                        <p
                            className="
                                font-medium
                            "
                        >
                            {row.type}
                        </p>

                    </div>

                    <div>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Sumber
                        </p>

                        <p
                            className="
                                font-medium
                            "
                        >
                            {row.source}
                        </p>

                    </div>

                    <div>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Deskripsi
                        </p>

                        <p
                            className="
                                font-medium
                            "
                        >
                            {row.description}
                        </p>

                    </div>

                    <div>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Nominal
                        </p>

                        <p
                            className="
                                text-lg
                                font-semibold
                            "
                        >
                            {row.amountLabel}
                        </p>

                    </div>

                    <div>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Saldo Setelah
                        </p>

                        <p
                            className="
                                text-lg
                                font-semibold
                            "
                        >
                            {row.balanceLabel}
                        </p>

                    </div>

                    <div>

                        <p
                            className="
                                text-sm
                                text-slate-500
                            "
                        >
                            Tanggal
                        </p>

                        <p
                            className="
                                font-medium
                            "
                        >
                            {row.date}
                        </p>

                    </div>

                </div>

            </div>

        </div>
    )
}