'use client'

import { useTranslations } from 'next-intl'
import {
    isPending
} from '../../services/payment-status'

interface ApprovalActionBarProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment:   any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onApprove: (payment: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onReject:  (payment: any) => void
    loading:   boolean
}

export default function ApprovalActionBar({

                                              payment,

                                              onApprove,

                                              onReject,

                                              loading

                                          }: ApprovalActionBarProps) {

    const t = useTranslations('payments')

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