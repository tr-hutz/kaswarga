'use client'

import { useTranslations } from 'next-intl'

interface Props {
    onRetry?: () => void
}

export default function ErrorState({ onRetry }: Props) {
    const t = useTranslations('dataTable')

    return (
        <tr data-testid="dt-error">
            <td colSpan={999}>
                <div className="py-16 text-center">
                    <p className="text-sm text-danger font-medium">{t('error')}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-sm text-danger underline hover:opacity-80"
                        >
                            {t('retry')}
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}
