// @ts-nocheck
'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

function NoBukti() {
    return (
        <div
            className="
                w-full
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                flex
                flex-col
                items-center
                justify-center
                gap-2
                py-12
                text-slate-400
            "
        >
            <ImageOff className="w-10 h-10" />
            <span className="text-sm">Bukti tidak dapat dimuat</span>
        </div>
    )
}

export default function PaymentProofPreview({ url }) {

    const [failed, setFailed] = useState(false)

    if (!url) {
        return <NoBukti />
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

            {failed ? (

                <NoBukti />

            ) : (

                <img
                    src={url}
                    alt="Bukti Pembayaran"
                    onError={() => setFailed(true)}
                    className="
                        w-full
                        rounded-2xl
                        border
                        object-cover
                    "
                />

            )}

        </div>
    )
}