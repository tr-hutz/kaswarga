// @ts-nocheck
'use client'

import {

    buildLedgerAnalytics

} from '../../services/ledger-analytics'

import {

    formatRupiah

} from '../../../../lib/utils'

export default function LedgerAnalytics({

                                            rows = []

                                        }) {

    const analytics =
        buildLedgerAnalytics(
            rows
        )

    return (

        <div
            className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-4
            "
        >

            <div
                className="
                    bg-white
                    rounded-2xl
                    border
                    p-5
                "
            >

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    Total Pemasukan
                </p>

                <h2
                    className="
                        mt-2
                        text-2xl
                        font-bold
                    "
                >
                    {
                        formatRupiah(
                            analytics.income
                        )
                    }
                </h2>

            </div>

            <div
                className="
                    bg-white
                    rounded-2xl
                    border
                    p-5
                "
            >

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    Total Pengeluaran
                </p>

                <h2
                    className="
                        mt-2
                        text-2xl
                        font-bold
                    "
                >
                    {
                        formatRupiah(
                            analytics.expense
                        )
                    }
                </h2>

            </div>

            <div
                className="
                    bg-white
                    rounded-2xl
                    border
                    p-5
                "
            >

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    Saldo Akhir
                </p>

                <h2
                    className="
                        mt-2
                        text-2xl
                        font-bold
                    "
                >
                    {
                        formatRupiah(
                            analytics.balance
                        )
                    }
                </h2>

            </div>

        </div>
    )
}