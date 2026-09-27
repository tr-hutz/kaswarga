'use client'

import { useState }        from 'react'
import { useTranslations } from 'next-intl'
import type { GuideRow }   from '@/lib/repositories/guide.repository'

const CATEGORY_ORDER = ['quick_start', 'feature', 'faq', 'general']

interface Props {
    sections: GuideRow[]
}

export default function GuidePublicView({ sections }: Props) {
    const t = useTranslations('guide')

    const [activeId, setActiveId] = useState<string | null>(
        sections.length > 0 ? sections[0].id : null,
    )

    const categories = CATEGORY_ORDER.filter(cat =>
        sections.some(s => s.category === cat),
    )

    const activeSection = sections.find(s => s.id === activeId)

    if (sections.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted text-sm">
                {t('public.empty')}
            </div>
        )
    }

    return (
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
                {activeSection ? (
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

                {/* Mobile: stacked list */}
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
    )
}
