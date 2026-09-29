'use client'

import { useState }          from 'react'
import { useTranslations }   from 'next-intl'
import type { GuideRow }     from '@/lib/repositories/guide.repository'

const LOCALES = [
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'en', label: 'English' },
] as const

const CATEGORY_ORDER = ['quick_start', 'feature', 'faq', 'general']

interface Props {
    initialSections: GuideRow[]
}

export default function GuidePublicView({ initialSections }: Props) {
    const t = useTranslations('guide')

    const [sections,     setSections]     = useState<GuideRow[]>(initialSections)
    const [activeId,     setActiveId]     = useState<string | null>(initialSections[0]?.id ?? null)
    const [locale,       setLocale]       = useState<'id' | 'en'>('id')
    const [loadingLang,  setLoadingLang]  = useState(false)

    async function switchLocale(newLocale: 'id' | 'en') {
        if (newLocale === locale) return
        setLoadingLang(true)
        try {
            const res = await fetch(`/api/guide?locale=${newLocale}`)
            if (res.ok) {
                const data = await res.json() as GuideRow[]
                setSections(data)
                setActiveId(data[0]?.id ?? null)
            }
        } finally {
            setLoadingLang(false)
        }
        setLocale(newLocale)
    }

    const categories = CATEGORY_ORDER.filter(cat => sections.some(s => s.category === cat))
    const activeSection = sections.find(s => s.id === activeId)

    if (sections.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted text-sm">
                {t('public.empty')}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-canvas border border-divider w-fit">
                {LOCALES.map(loc => (
                    <button
                        key={loc.code}
                        onClick={() => switchLocale(loc.code)}
                        disabled={loadingLang}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                            locale === loc.code
                                ? 'bg-primary text-white'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {loc.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-6 min-h-[60vh]">
                {/* Sidebar TOC */}
                <aside className="w-56 shrink-0 hidden md:block">
                    <nav className="space-y-4">
                        {categories.map(cat => (
                            <div key={cat}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1 px-2">
                                    {t(`categories.${cat}`)}
                                </p>
                                <ul className="space-y-0.5">
                                    {sections
                                        .filter(s => s.category === cat)
                                        .map(s => (
                                            <li key={s.id}>
                                                <button
                                                    onClick={() => setActiveId(s.id)}
                                                    className={`
                                                        w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors
                                                        ${s.id === activeId
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'text-foreground hover:bg-canvas'}
                                                    `}
                                                >
                                                    {s.title}
                                                </button>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {loadingLang ? (
                        <div className="flex items-center justify-center h-40 text-muted text-sm animate-pulse">
                            {t('public.loading')}
                        </div>
                    ) : activeSection ? (
                        <article className="rounded-xl border border-divider bg-surface p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4">{activeSection.title}</h2>
                            <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans">
                                {activeSection.body}
                            </pre>
                        </article>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted text-sm">
                            {t('public.selectSection')}
                        </div>
                    )}

                    {/* Mobile stacked list */}
                    <div className="mt-6 space-y-4 md:hidden">
                        {sections.map(s => (
                            <article key={s.id} className="rounded-xl border border-divider bg-surface p-4">
                                <h2 className="text-base font-bold text-foreground mb-2">{s.title}</h2>
                                <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans">
                                    {s.body}
                                </pre>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
