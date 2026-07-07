// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import { getStatusClass } from '../../services/pembayaran-status'

export default function PaymentStatusBadge({ status }) {
    const t = useTranslations('common')

    const labelMap: Record<string, string> = {
        approved: t('paymentStatus.approved'),
        pending:  t('paymentStatus.pending'),
        rejected: t('paymentStatus.rejected'),
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
            {labelMap[status] ?? '-'}
        </span>
    )
}
