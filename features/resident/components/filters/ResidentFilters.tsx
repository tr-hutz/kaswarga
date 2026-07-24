'use client'

import { useTranslations } from 'next-intl'

interface Props {
    active?:        string
    onActiveChange: (value: string) => void
}

export default function ResidentFilters({ active = '', onActiveChange }: Props) {
    const t  = useTranslations('residents')
    const tc = useTranslations('common')

    return (
        <select
            data-testid="dt-status-filter"
            value={active}
            onChange={(e) => onActiveChange(e.target.value)}
            className="h-9 rounded-lg border border-divider bg-surface px-3 text-sm text-foreground"
        >
            <option value="">{t('filterPlaceholder')}</option>
            <option value="true">{tc('status.active')}</option>
            <option value="false">{tc('status.inactive')}</option>
        </select>
    )
}
