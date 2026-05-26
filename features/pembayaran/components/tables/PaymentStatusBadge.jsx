'use client'

import {

    getStatusLabel,

    getStatusClass

} from '../../services/pembayaran-status'

export default function PaymentStatusBadge({

                                               status

                                           }) {

    return (

        <span
            className={`
                inline-flex
                items-center
                px-3
                py-1
                rounded-full
                text-xs
                font-medium
                ${getStatusClass(status)}
            `}
        >

            {
                getStatusLabel(
                    status
                )
            }

        </span>
    )
}