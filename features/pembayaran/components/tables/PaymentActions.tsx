// @ts-nocheck
'use client'

export default function PaymentActions({

                                           row,

                                           onApprove,
                                           onReject

                                       }) {

    if (
        row.status !== 'pending'
    ) {

        return null
    }
    return (

        <div className="flex gap-2">

            <button
                onClick={() =>
                    onApprove(row.id)
                }
                className="px-3 py-1 rounded-lg bg-green-600 text-white">
                Approve
            </button>

            <button
                onClick={() => {

                    const alasan =
                        prompt(
                            'Alasan penolakan'
                        )

                    if (!alasan) {
                        return
                    }

                    onReject(
                        row.id,
                        alasan
                    )

                }}
                className="
          px-3
          py-1
          rounded-lg
          bg-red-600
          text-white
        "
            >
                Reject
            </button>

        </div>
    )
}