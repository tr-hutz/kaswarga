// @ts-nocheck
'use client'

import PaymentStatusBadge from './PaymentStatusBadge'
import { formatRupiah } from '../../../../lib/utils'
import { useTranslations } from 'next-intl'

export default function PaymentRow({

                                       row,

                                       onClick

                                   }) {

    const t = useTranslations('pembayaran')

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
                {row.name}
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                {t('detail.blockPrefix')} {row.block} / {row.houseNumber}
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                {row.monthLabel || '-'}
            </td>

            <td
                className="
                    px-4
                    py-4
                "
            >
                {
                formatRupiah(
                    row.totalAmount || 0
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