'use client'

import { useTranslations } from 'next-intl'

const STATUS_STYLE: Record<string, string> = {
    approved: 'bg-success/10 border-success',
    pending:  'bg-warning/10 border-warning',
    rejected: 'bg-danger/10 border-danger',
    unpaid:   'bg-canvas border-divider'
}

const STATUS_TEXT: Record<string, string> = {
    approved: 'text-success',
    pending:  'text-warning',
    rejected: 'text-danger',
    unpaid:   'text-muted'
}

export default function MonthCard({ month, status }: { month: string; status?: string }) {

    const t = useTranslations('common')
    const finalStatus = status || 'unpaid'

    const statusLabel: Record<string, string> = {
        approved: t('paymentStatus.paid'),
        pending:  t('paymentStatus.pending'),
        rejected: t('paymentStatus.rejected'),
        unpaid:   t('paymentStatus.unpaid')
    }

    return (
        <div className={`border rounded-xl p-4 transition ${STATUS_STYLE[finalStatus]}`}>
            <div className="font-semibold text-lg text-foreground">{month}</div>
            <div className={`text-sm mt-2 ${STATUS_TEXT[finalStatus]}`}>{statusLabel[finalStatus]}</div>
        </div>
    )
}
