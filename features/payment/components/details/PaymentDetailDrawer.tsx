'use client'

import { useTranslations } from 'next-intl'
import Icon       from '@/components/ui/Icon'
import Ribbadge   from '@/components/ui/Ribbadge'
import { MONTHS } from '@/lib/constants/months'

import PaymentProofPreview from './PaymentProofPreview'
import ApprovalActionBar   from '../approval/ApprovalActionBar'
import { useKeyDown }      from '../../../../lib/hooks/useKeyDown'

interface PaymentDetailDrawerProps {
    open:        boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment:     any
    onClose:     () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onApprove:   (payment?: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onReject:  (payment?: any) => void
    loading:   boolean
    role:      string | null | undefined
}

export default function PaymentDetailDrawer({
    open,
    payment,
    onClose,
    onApprove,
    onReject,
    loading,
    role,
}: PaymentDetailDrawerProps) {

    const t  = useTranslations('payments')
    const tc = useTranslations('common')

    useKeyDown(open, { Escape: onClose })

    if (!open || !payment) return null

    const statusLabel = tc(`paymentStatus.${payment.status}` as Parameters<typeof tc>[0])

    return (
        <div
            data-testid="payment-drawer"
            className="fixed inset-0 z-50 flex justify-end bg-black/30"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl h-full bg-surface overflow-y-auto shadow-default p-6 space-y-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="pb-4 border-b border-divider flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">{t('detail.title')}</h2>
                        <p className="text-sm text-muted mt-0.5">{t('detail.subtitle')}</p>
                    </div>
                    <button
                        data-testid="close-drawer"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="text-muted hover:text-foreground mt-0.5"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Card */}
                <div className="relative overflow-hidden rounded-xl border border-divider bg-canvas pt-8">
                    <Ribbadge label={statusLabel} status={payment.status} variant="filled" />

                    <div className="p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted">{t('detail.residentName')}</p>
                                <p className="font-medium text-foreground">{payment.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">{t('detail.house')}</p>
                                <p className="font-medium text-foreground">
                                    {t('detail.blockPrefix')} {payment.block} / {payment.houseNumber}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">{t('detail.monthsPaid')}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {(payment.details || []).map((d: { id: string; month: number }) => {
                                        const month = MONTHS.find(m => Number(m.id) === Number(d.month))
                                        return (
                                            <span key={d.id} className="px-2 py-1 rounded-md bg-surface text-xs">
                                                {month?.name}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted">{t('detail.totalAmount')}</p>
                                <p className="font-semibold text-foreground">
                                    Rp {Number(payment.totalAmount || 0).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        <PaymentProofPreview url={payment.proofUrl} />

                        <ApprovalActionBar
                            payment={payment}
                            onApprove={onApprove}
                            onReject={onReject}
                            loading={loading}
                            role={role}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
