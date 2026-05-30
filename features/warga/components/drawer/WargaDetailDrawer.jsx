'use client'

import {
    X
} from 'lucide-react'

import WargaDetailSummary
    from '../detail/WargaDetailSummary'

import WargaPaymentHistory
    from './WargaPaymentHistory'

export default function WargaDetailDrawer({

                                              open,

                                              warga,

                                              onClose

                                          }) {

    if (!open || !warga) {
        return null
    }

    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                justify-end
                bg-black/30
            "

            onClick={onClose}
        >

            <div
                className="
                    h-full
                    w-full
                    max-w-lg
                    bg-white
                    shadow-2xl
                    p-6
                    overflow-y-auto
                "
            >

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        mb-6
                    "
                >

                    <h1
                        className="
                            text-lg
                            font-semibold
                        "
                    >
                        Detail Warga
                    </h1>

                    <button
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </button>

                </div>

                <WargaDetailSummary
                    warga={warga}
                />

                <WargaPaymentHistory
                    paymentHistory={
                        warga?.paymentHistory || []
                    }
                />

            </div>

        </div>
    )
}