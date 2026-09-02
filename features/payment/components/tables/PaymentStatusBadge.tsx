'use client'

import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import { getStatusClass } from '@/features/payment/services/payment-status'

export default function PaymentStatusBadge({ status }: { status: string }) {
    const t = useTranslations('common')

    const labelMap: Record<string, string> = {
        approved: t('paymentStatus.approved'),
        pending:  t('paymentStatus.pending'),
        rejected: t('paymentStatus.rejected'),
    }

    return (
        <Badge className={getStatusClass(status)}>
            {labelMap[status] ?? '-'}
        </Badge>
    )
}
