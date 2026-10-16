import { redirect }                              from 'next/navigation'
import { getTranslations }                       from 'next-intl/server'
import { getRequestContext }                     from '@/lib/auth/server'
import { UnauthorizedError }                     from '@/lib/auth/errors'
import { getPublishedSections, getAvailableLocales } from '@/lib/services/guide.service'
import GuidePublicView                           from '@/features/guide/GuidePublicView'

export const dynamic = 'force-dynamic'

export default async function HelpPage() {
    let sections: Awaited<ReturnType<typeof getPublishedSections>>
    let availableLocales: string[]

    try {
        const ctx = await getRequestContext()
        ;[sections, availableLocales] = await Promise.all([
            getPublishedSections('id', ctx.authorization),
            getAvailableLocales(),
        ])
    } catch (err) {
        if (err instanceof UnauthorizedError) redirect('/login')
        throw err
    }

    const t = await getTranslations('guide')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('public.title')}</h1>
                <p className="text-sm text-muted mt-0.5">{t('public.subtitle')}</p>
            </div>
            <GuidePublicView initialSections={sections} availableLocales={availableLocales} />
        </div>
    )
}
