'use client'

import { useTranslations } from 'next-intl'
import PaymentStatusBadge
    from '../tables/PaymentStatusBadge'

import PaymentDetailSummary
    from './PaymentDetailSummary'

import PaymentDetailMonths
    from './PaymentDetailMonths'

import PaymentProofPreview
    from './PaymentProofPreview'

import ApprovalActionBar
    from '../approval/ApprovalActionBar'

import {
    useKeyDown
} from '../../../../lib/hooks/useKeyDown'

interface PaymentDetailDrawerProps {
    open:      boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment:   any
    onClose:   () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onApprove: (payment?: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onReject:  (payment?: any) => void
    loading:   boolean
}

export default function PaymentDetailDrawer({

                                                open,

                                                payment,

                                                onClose,

                                                onApprove,

                                                onReject,

                                                loading

                                            }: PaymentDetailDrawerProps) {

    const t = useTranslations('payments')

    useKeyDown(open, { Escape: onClose })

    if (!open || !payment) {
        return null
    }

    return (

        <div
            data-testid="payment-drawer"
            className="
                fixed
                inset-0
                z-50
                flex
                justify-end
                bg-black/30
            "
        >

            <div
                className="
                    w-full
                    max-w-xl
                    h-full
                    bg-surface
                    overflow-y-auto
                    shadow-default
                    p-6
                    space-y-6
                "
            >

                {/* HEADER */}

                <div
                    className="
                        flex
                        items-start
                        justify-between
                    "
                >

                    <div>

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-foreground
                            "
                        >
                            {t('detail.title')}
                        </h2>

                        <p
                            className="
                                text-sm
                                text-muted
                            "
                        >
                            {t('detail.subtitle')}
                        </p>

                    </div>

                    <button
                        data-testid="close-drawer"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="
                            text-muted
                            hover:text-foreground
                        "
                    >
                        ✕
                    </button>

                </div>

                {/* STATUS */}

                <PaymentStatusBadge
                    status={payment.status}
                />

                {/* SUMMARY */}

                <PaymentDetailSummary
                    payment={payment}
                />

                {/* MONTHS */}

                <PaymentDetailMonths
                    details={payment.details}
                />

                {/* PROOF */}

                <PaymentProofPreview
                    url={payment.proofUrl}
                />

                {/* ACTION */}

                <ApprovalActionBar
                    payment={payment}
                    onApprove={onApprove}
                    onReject={onReject}
                    loading={loading}
                />

            </div>

        </div>
    )
}