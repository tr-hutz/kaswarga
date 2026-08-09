'use client'

import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'

function getStatusClass(status: string) {
    switch (status) {
        case 'approved': return 'bg-success/10 text-success'
        case 'pending':  return 'bg-warning/10 text-warning'
        case 'rejected': return 'bg-danger/10 text-danger'
        default:         return 'bg-canvas text-muted'
    }
}

export default function IncomeStatusBadge({ status }: { status: string }) {
    const t = useTranslations('income')
    const label = t(`status.${status}` as Parameters<typeof t>[0])
    return (
        <Badge className={getStatusClass(status)}>
            {label ?? status}
        </Badge>
    )
}
