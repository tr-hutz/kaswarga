'use client'

import { useTranslations } from 'next-intl'
import Icon       from '@/components/ui/Icon'
import Ribbadge   from '@/components/ui/Ribbadge'
import { MONTHS } from '@/constants/months'

import PaymentProofPreview from './PaymentProofPreview'
import ApprovalActionBar   from '../approval/ApprovalActionBar'
import { useKeyDown }      from '../../../../lib/hooks/useKeyDown'

function formatMonthRanges(details: { id: string; month: number }[], year: number): string {
    const months = [...new Set(details.map(d => Number(d.month)))]
        .filter(m => m >= 1 && m <= 12)
        .sort((a, b) => a - b)

    if (!months.length) return ''

    const runs: number[][] = []
    let run = [months[0]]
    for (let i = 1; i < months.length; i++) {
        if (months[i] === months[i - 1] + 1) {
            run.push(months[i])
        } else {
            runs.push(run)
            run = [months[i]]
        }
    }
    runs.push(run)

    const parts = runs.map(r => {
        const first = MONTHS.find(m => m.id === r[0])?.name ?? ''
        if (r.length === 1) return first
        const last = MONTHS.find(m => m.id === r[r.length - 1])?.name ?? ''
        return `${first} – ${last}`
    })

    return `${parts.join(', ')} ${year}`
}

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
                                <p className="font-medium text-foreground">
                                    {formatMonthRanges(payment.details || [], payment.year)}
                                </p>
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
