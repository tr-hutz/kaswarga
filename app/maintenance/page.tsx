import { getTranslations } from 'next-intl/server'

export default async function MaintenancePage() {
    const t = await getTranslations('maintenance')

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-canvas">
            <p className="text-6xl font-bold text-stroke mb-4">⚙</p>
            <h1 className="text-xl font-semibold text-foreground mb-2">{t('title')}</h1>
            <p className="text-sm text-muted mb-2">{t('description')}</p>
            <p className="text-xs text-subtle">{t('notice')}</p>
        </div>
    )
}
