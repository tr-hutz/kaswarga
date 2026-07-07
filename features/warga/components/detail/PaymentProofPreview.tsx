// @ts-nocheck
'use client'

export default function PaymentProofPreview({

                                                url

                                            }) {

    if (!url) {

        return (

            <div
                className="
                    text-sm
                    text-slate-500
                "
            >
                Bukti pembayaran tidak tersedia
            </div>
        )
    }

    return (

        <div>

            <h3
                className="
                    text-sm
                    font-semibold
                    mb-3
                "
            >
                Bukti Pembayaran
            </h3>

            <img
                src={url}
                alt="Bukti Pembayaran"
                className="
                    w-full
                    rounded-2xl
                    border
                    object-cover
                "
            />

        </div>
    )
}