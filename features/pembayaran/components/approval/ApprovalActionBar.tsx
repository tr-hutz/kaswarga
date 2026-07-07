// @ts-nocheck
'use client'

import {
    isPending
} from '../../services/pembayaran-status'

export default function ApprovalActionBar({

                                              payment,

                                              onApprove,

                                              onReject,

                                              loading

                                          }) {

    if (
        !payment ||
        !isPending(payment.status)
    ) {

        return null
    }

    return (

        <div
            className="
                flex
                items-center
                gap-3
                pt-4
            "
        >

            <button
                onClick={() =>
                    onApprove(payment)
                }
                disabled={loading}
                className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl
                    bg-emerald-600
                    text-white
                    font-medium
                    hover:bg-emerald-700
                    transition
                "
            >
                Approve
            </button>

            <button
                onClick={() =>
                    onReject(payment)
                }
                disabled={loading}
                className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl
                    bg-red-600
                    text-white
                    font-medium
                    hover:bg-red-700
                    transition
                "
            >
                Reject
            </button>

        </div>
    )
}