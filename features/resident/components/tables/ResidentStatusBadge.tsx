'use client'

import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import { getResidentStatusClasses } from '@/features/resident/services/resident-status'

export default function ResidentStatusBadge({ status }: { status: string }) {
    const tc = useTranslations('common')

    const labelMap: Record<string, string> = {
        active:   tc('status.active'),
        inactive: tc('status.inactive'),
    }

    return (
        <Badge className={getResidentStatusClasses(status)}>
            {labelMap[status] ?? '-'}
        </Badge>
    )
}
