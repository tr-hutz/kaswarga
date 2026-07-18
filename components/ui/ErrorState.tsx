'use client'

import { useTranslations } from 'next-intl'

interface Props {
    onRetry?: () => void
}

export default function ErrorState({ onRetry }: Props) {
    const t = useTranslations('common')

    return (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">
            <p className="text-sm text-danger font-medium">{t('errors.generic')}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-3 text-sm text-danger underline hover:opacity-80"
                >
                    {t('actions.retry')}
                </button>
            )}
        </div>
    )
}
