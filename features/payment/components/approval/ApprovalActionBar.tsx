// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import {
    isPending
} from '../../services/payment-status'

export default function ApprovalActionBar({

                                              payment,

                                              onApprove,

                                              onReject,

                                              loading

                                          }) {

    const t = useTranslations('pembayaran')

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
                {t('approval.approve')}
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
                {t('approval.reject')}
            </button>

        </div>
    )
}