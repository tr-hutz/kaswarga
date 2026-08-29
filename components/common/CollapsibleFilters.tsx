'use client'

import { useState }  from 'react'
import { useTranslations } from 'next-intl'
import Icon          from '@/components/ui/Icon'

interface Props {
    children:     React.ReactNode
    activeCount?: number
}

export default function CollapsibleFilters({ children, activeCount = 0 }: Props) {
    const t = useTranslations('common')
    const [open, setOpen] = useState(false)

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 h-9 px-3 rounded-lg border border-divider text-sm bg-surface hover:bg-canvas text-foreground transition-colors"
            >
                <Icon name="funnel" size={15} />
                {t('filter.placeholder')}
                {activeCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-medium">
                        {activeCount}
                    </span>
                )}
                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} className="text-muted" />
            </button>

            {open && (
                <div className="flex items-center gap-2 flex-wrap p-3 bg-canvas rounded-lg border border-divider">
                    {children}
                </div>
            )}
        </div>
    )
}
