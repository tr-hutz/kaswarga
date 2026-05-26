'use client'

import LedgerRow
    from './LedgerRow'

export default function LedgerTable({

                                        rows = [],
                                        loading,

                                        onSelect

                                    }) {

    if (loading) {

        return (

            <div
                className="
                    bg-white
                    rounded-2xl
                    border
                    p-8
                    text-center
                "
            >
                Loading...
            </div>
        )
    }

    return (

        <div
            className="
                bg-white
                rounded-2xl
                border
                overflow-hidden
            "
        >

            <table
                className="
                    w-full
                    text-sm
                "
            >

                <thead
                    className="
                        bg-slate-50
                    "
                >

                <tr>

                    <th className="p-4 text-left">
                        Tanggal
                    </th>

                    <th className="p-4 text-left">
                        Jenis
                    </th>

                    <th className="p-4 text-left">
                        Deskripsi
                    </th>

                    <th className="p-4 text-right">
                        Nominal
                    </th>

                    <th className="p-4 text-right">
                        Saldo
                    </th>

                </tr>

                </thead>

                <tbody>

                {rows.map(row => (

                    <LedgerRow

                        key={row.id}

                        row={row}

                        onSelect={
                            onSelect
                        }

                    />

                ))}

                </tbody>

            </table>

        </div>
    )
}