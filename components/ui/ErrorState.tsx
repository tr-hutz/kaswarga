'use client'

import { useTranslations } from 'next-intl'

interface Props {
    onRetry?: () => void
}

export default function ErrorState({ onRetry }: Props) {
    const t = useTranslations('common')

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-sm text-red-600 font-medium">{t('errors.generic')}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-3 text-sm text-red-500 underline hover:text-red-700"
                >
                    {t('actions.retry')}
                </button>
            )}
        </div>
    )
}
