'use client'

import { useTranslations } from 'next-intl'

export default function EmptyState() {
    const t = useTranslations('dataTable')

    return (
        <tr data-testid="dt-empty">
            <td colSpan={999}>
                <div className="py-16 text-center text-sm text-dark-6">
                    {t('noData')}
                </div>
            </td>
        </tr>
    )
}
