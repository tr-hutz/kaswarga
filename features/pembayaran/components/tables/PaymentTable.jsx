'use client'

import PaymentRow
    from './PaymentRow'

export default function PaymentTable({

                                         rows = [],

                                         onSelect

                                     }) {

    return (

        <div
            className="
                overflow-x-auto
                bg-white
                rounded-2xl
                border
            "
        >

            <table
                className="
                    min-w-full
                    text-sm
                "
            >

                <thead
                    className="
                        bg-slate-50
                        border-b
                    "
                >

                <tr>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        Nama
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        Rumah
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        Bulan
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        Total
                    </th>

                    <th
                        className="
                                text-left
                                px-4
                                py-3
                            "
                    >
                        Status
                    </th>

                </tr>

                </thead>

                <tbody>

                {
                    rows.map(row => (

                            <PaymentRow
                                key={row.id}
                                row={row}
                                onClick={onSelect}
                            />

                        ))
                }

                </tbody>

            </table>

        </div>
    )
}