'use client'

export default function LedgerRow({

                                      row,
                                      onSelect

                                  }) {

    return (

        <tr

            onClick={() =>
                onSelect(row)
            }

            className="
                border-t
                hover:bg-slate-50
                cursor-pointer
            "
        >

            <td className="p-4">
                {row.tanggal}
            </td>

            <td className="p-4">

                <span
                    className={`
                        px-2
                        py-1
                        rounded-lg
                        text-xs

                        ${
                        row.jenis ===
                        'pemasukan'

                            ? `
                                    bg-green-100
                                    text-green-700
                                `

                            : `
                                    bg-red-100
                                    text-red-700
                                `
                    }
                    `}
                >

                    {row.jenis}

                </span>

            </td>

            <td className="p-4">
                {row.deskripsi}
            </td>

            <td
                className="
                    p-4
                    text-right
                    font-medium
                "
            >
                {row.nominalLabel}
            </td>

            <td
                className="
                    p-4
                    text-right
                    font-semibold
                "
            >
                {row.saldoLabel}
            </td>

        </tr>
    )
}