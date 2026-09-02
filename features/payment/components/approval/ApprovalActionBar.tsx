'use client'

import { useTranslations }  from 'next-intl'
import { isPending }        from '@/features/payment/services/payment-status'
import { usePermission }    from '@/lib/auth/usePermission'
import { PERMISSION }       from '@/lib/auth/types'

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

    const t              = useTranslations('payments')
    const canApprove     = usePermission(PERMISSION.PAYMENT_APPROVE)

    if (
        !payment ||
        !isPending(payment.status) ||
        !canApprove
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
                    rounded-lg
                    bg-success
                    text-white
                    font-medium
                    hover:bg-success/90
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
                    rounded-lg
                    bg-danger
                    text-white
                    font-medium
                    hover:bg-danger/90
                    transition
                "
            >
                {t('approval.reject')}
            </button>

        </div>
    )
}
