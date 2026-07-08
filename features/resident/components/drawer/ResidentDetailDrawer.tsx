// @ts-nocheck
'use client'

import {
    X
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import ResidentDetailSummary
    from '../detail/ResidentDetailSummary'

import ResidentPaymentHistory
    from './ResidentPaymentHistory'

export default function ResidentDetailDrawer({

                                              open,

                                              warga,

                                              onClose

                                          }) {

    const t = useTranslations('residents')

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
                        {t('drawer.title')}
                    </h1>

                    <button
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </button>

                </div>

                <ResidentDetailSummary
                    warga={warga}
                />

                <ResidentPaymentHistory
                    paymentHistory={
                        warga?.paymentHistory || []
                    }
                />

            </div>

        </div>
    )
}