'use client'

import PaymentStatusBadge
    from './PaymentStatusBadge'

export default function PaymentRow({

                                       row,

                                       onClick

                                   }) {

    if (!row) {
        return null
    }

    return (

        <tr
            onClick={() =>
                onClick(row)
            }
            className="
                border-b
                hover:bg-slate-50
                cursor-pointer
                transition
            "
        >

            <td
                className="
                    px-4
                    py-4
                "
            >
                {row.nama}
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                Blok {row.blok} / {row.noRumah}
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                {row.bulanLabel || '-'}
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                Rp {
                Number(
                    row.totalBayar || 0
                ).toLocaleString('id-ID')
            }
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                <PaymentStatusBadge
                    status={row.status}
                />
            </td>

        </tr>
    )
}