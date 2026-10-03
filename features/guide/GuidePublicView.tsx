'use client'

import { useState, useMemo }  from 'react'
import { useTranslations }     from 'next-intl'
import Icon                    from '@/components/ui/Icon'
import GuideMarkdown           from './components/GuideMarkdown'
import GuideFeedback           from './components/GuideFeedback'
import type { GuideRow }       from '@/lib/repositories/guide.repository'

const LOCALE_LABELS: Record<string, string> = {
    id: 'Bahasa Indonesia',
    en: 'English',
}

const CATEGORY_ORDER = ['quick_start', 'feature', 'faq', 'general']

/** Pick the first section ID respecting CATEGORY_ORDER — ensures Welcome (quick_start #1) is always the default. */
function findFirstId(secs: GuideRow[]): string | null {
    for (const cat of CATEGORY_ORDER) {
        const s = secs.find(r => r.category === cat)
        if (s) return s.id
    }
    return secs[0]?.id ?? null
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
    initialSections:  GuideRow[]
    availableLocales: string[]
}

export default function GuidePublicView({ initialSections, availableLocales }: Props) {
    const t = useTranslations('guide')

    const [sections,    setSections]    = useState<GuideRow[]>(initialSections)
    const [activeId,    setActiveId]    = useState<string | null>(findFirstId(initialSections))
    const [locale,      setLocale]      = useState<'id' | 'en'>('id')
    const [loadingLang, setLoadingLang] = useState(false)
    const [search,      setSearch]      = useState('')

    async function switchLocale(newLocale: 'id' | 'en') {
        if (newLocale === locale) return
        setLoadingLang(true)
        try {
            const res = await fetch(`/api/guide?locale=${newLocale}`)
            if (res.ok) {
                const data = await res.json() as GuideRow[]
                setSections(data)
                setActiveId(findFirstId(data))
            }
        } finally {
            setLoadingLang(false)
        }
        setLocale(newLocale)
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return sections
        return sections.filter(s =>
            s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
        )
    }, [sections, search])

    const categories    = CATEGORY_ORDER.filter(cat => filtered.some(s => s.category === cat))
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
            {/* Top bar: search + locale switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Icon
                        name="search"
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('public.searchPlaceholder')}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-divider bg-surface text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* Locale switcher — only when multiple locales exist */}
                {availableLocales.length > 1 && (
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-canvas border border-divider w-fit">
                        {availableLocales.map(code => (
                            <button
                                key={code}
                                onClick={() => switchLocale(code as 'id' | 'en')}
                                disabled={loadingLang}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                                    locale === code
                                        ? 'bg-primary text-white'
                                        : 'text-muted hover:text-foreground'
                                }`}
                            >
                                {LOCALE_LABELS[code] ?? code}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-6 min-h-[60vh]">
                {/* Sidebar TOC */}
                <aside className="w-56 shrink-0 hidden md:block">
                    <nav className="space-y-4">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted px-2">{t('public.searchEmpty')}</p>
                        ) : categories.map(cat => (
                            <div key={cat}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1 px-2">
                                    {t(`categories.${cat}`)}
                                </p>
                                <ul className="space-y-0.5">
                                    {filtered
                                        .filter(s => s.category === cat)
                                        .map(s => (
                                            <li key={s.id}>
                                                <button
                                                    onClick={() => { setActiveId(s.id); setSearch('') }}
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

                            <GuideMarkdown body={activeSection.body} />

                            {/* Footer: last updated + feedback */}
                            <div className="mt-6 pt-4 border-t border-divider flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-xs text-muted">
                                    {t('public.updatedAt', { date: formatDate(activeSection.updated_at) })}
                                </p>
                                <GuideFeedback sectionId={activeSection.id} key={activeSection.id} />
                            </div>
                        </article>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted text-sm">
                            {t('public.selectSection')}
                        </div>
                    )}

                    {/* Mobile stacked list */}
                    <div className="mt-6 space-y-4 md:hidden">
                        {filtered.map(s => (
                            <article key={s.id} className="rounded-xl border border-divider bg-surface p-4">
                                <h2 className="text-base font-bold text-foreground mb-3">{s.title}</h2>
                                <GuideMarkdown body={s.body} />
                                <div className="mt-4 pt-3 border-t border-divider">
                                    <GuideFeedback sectionId={s.id} key={s.id} />
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
