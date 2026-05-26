'use client'

import PaymentHistoryRow from './PaymentHistoryRow'

export default function PaymentHistoryTable({

                                                data = []

                                            }) {

    return (

        <div
            className="
        bg-white
        rounded-2xl
        border
        overflow-hidden
      "
        >

            <table className="w-full">

                <thead>

                <tr
                    className="
              bg-slate-50
              border-b
            "
                >

                    <th className="p-4 text-left">
                        Bulan
                    </th>

                    <th className="p-4 text-left">
                        Tahun
                    </th>

                    <th className="p-4 text-left">
                        Nominal
                    </th>

                    <th className="p-4 text-left">
                        Tanggal
                    </th>

                </tr>

                </thead>

                <tbody>

                {
                    data.map(row => (

                        <PaymentHistoryRow
                            key={
                                `${row.pembayaranId}-${row.bulan}`
                            }
                            row={row}
                        />
                    ))
                }

                </tbody>

            </table>

        </div>
    )
}