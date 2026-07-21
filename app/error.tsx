'use client'

import { useTranslations } from 'next-intl'

export default function Error({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const t = useTranslations('error')

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-6xl font-bold text-stroke mb-4">!</p>
            <h1 className="text-xl font-semibold text-foreground mb-2">{t('title')}</h1>
            <p className="text-sm text-muted mb-6">{t('description')}</p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors"
            >
                {t('retry')}
            </button>
        </div>
    )
}
