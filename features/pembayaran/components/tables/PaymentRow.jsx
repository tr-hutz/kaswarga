'use client'

import PaymentStatusBadge
    from './PaymentStatusBadge'
import {formatRupiah} from "../../../../lib/utils";

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
                {
                formatRupiah(
                    row.totalBayar || 0
                )
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