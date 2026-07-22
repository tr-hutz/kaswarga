'use client'

import { useTranslations } from 'next-intl'
import {
    isPending
} from '../../services/payment-status'
import { hasPermission } from '../../../../lib/permissions/permissions'
import { PERMISSIONS }   from '../../../../lib/permissions/permission-constants'

interface ApprovalActionBarProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment:   any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onApprove: (payment: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onReject:  (payment: any) => void
    loading:   boolean
    role:      string | null | undefined
}

export default function ApprovalActionBar({

                                              payment,

                                              onApprove,

                                              onReject,

                                              loading,

                                              role

                                          }: ApprovalActionBarProps) {

    const t = useTranslations('payments')

    if (
        !payment ||
        !isPending(payment.status) ||
        !hasPermission(role, PERMISSIONS.APPROVE_PAYMENTS)
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