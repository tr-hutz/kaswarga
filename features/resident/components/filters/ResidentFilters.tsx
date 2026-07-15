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
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
        >
            <option value="">{t('filterPlaceholder')}</option>
            <option value="true">{tc('status.active')}</option>
            <option value="false">{tc('status.inactive')}</option>
        </select>
    )
}
