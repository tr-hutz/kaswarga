'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

interface NotificationToolbarProps {
    search:        string
    setSearch:     (v: string) => void
    filter:        string
    setFilter:     (v: string) => void
    onMarkAllRead: () => void
}

export default function NotificationToolbar({
    search,
    setSearch,
    filter,
    setFilter,
    onMarkAllRead,
}: NotificationToolbarProps) {

    const t = useTranslations('notification')

    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">

            <div className="relative">
                <Icon
                    name="search"
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="
                        h-10 pl-8 pr-3
                        border border-divider rounded-lg
                        bg-surface text-foreground text-sm
                        outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                        transition-colors
                    "
                />
            </div>

            <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="
                    h-10 px-3
                    border border-divider rounded-lg
                    bg-surface text-foreground text-sm
                    outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-colors
                "
            >
                <option value="all">{t('filter.all')}</option>
                <option value="unread">{t('filter.unread')}</option>
            </select>

            <button
                onClick={onMarkAllRead}
                className="
                    h-10 px-3
                    border border-divider rounded-lg
                    bg-surface text-foreground text-sm
                    hover:bg-canvas transition-colors
                "
            >
                {t('markAllRead')}
            </button>

        </div>
    )
}
