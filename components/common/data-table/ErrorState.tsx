'use client'

import { useTranslations } from 'next-intl'

interface Props {
    onRetry?: () => void
}

export default function ErrorState({ onRetry }: Props) {
    const t = useTranslations('dataTable')

    return (
        <tr>
            <td colSpan={999}>
                <div className="py-16 text-center">
                    <p className="text-sm text-red-500 font-medium">{t('error')}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-sm text-red-400 underline hover:text-red-600"
                        >
                            {t('retry')}
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}
