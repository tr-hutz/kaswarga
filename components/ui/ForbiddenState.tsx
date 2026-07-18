'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function ForbiddenState() {
    const t = useTranslations('common')

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-6xl font-bold text-stroke mb-4">403</p>
            <h1 className="text-xl font-semibold text-dark mb-2">{t('errors.forbidden')}</h1>
            <p className="text-sm text-dark-5 mb-6">{t('errors.forbiddenDescription')}</p>
            <Link
                href="/dashboard"
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition"
            >
                {t('actions.back')}
            </Link>
        </div>
    )
}
