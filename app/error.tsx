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
            <p className="text-6xl font-bold text-gray-200 mb-4">!</p>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">{t('title')}</h1>
            <p className="text-sm text-gray-500 mb-6">{t('description')}</p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition"
            >
                {t('retry')}
            </button>
        </div>
    )
}
