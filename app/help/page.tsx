import { getTranslations }      from 'next-intl/server'
import { getPublishedSections }  from '@/lib/services/guide.service'
import GuidePublicView           from '@/features/guide/GuidePublicView'

export const dynamic = 'force-dynamic'

export default async function HelpPage() {
    const t        = await getTranslations('guide')
    const sections = await getPublishedSections()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('public.title')}</h1>
                <p className="text-sm text-muted mt-0.5">{t('public.subtitle')}</p>
            </div>
            <GuidePublicView sections={sections} />
        </div>
    )
}
