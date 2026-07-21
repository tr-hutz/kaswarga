'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Icon from '@/components/ui/Icon'
import NotificationItem from './NotificationItem'

const MAX_VISIBLE = 8

interface NotificationDropdownProps {
    open:                   boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifications?:         any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNotificationClick?:   (n: any) => void
    onMarkAllRead?:         () => void
}

export default function NotificationDropdown({
    open,
    notifications = [],
    onNotificationClick,
    onMarkAllRead,
}: NotificationDropdownProps) {

    const t = useTranslations('notification')

    if (!open) return null

    const visible = notifications.slice(0, MAX_VISIBLE)

    return (
        <div className="
            absolute right-0 top-full mt-2
            w-80 z-50
            bg-surface border border-divider rounded-xl shadow-default
            overflow-hidden
        ">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
                <h6 className="text-sm font-semibold text-foreground">{t('title')}</h6>
                <button
                    onClick={onMarkAllRead}
                    className="text-xs text-primary hover:text-primary-dark transition-colors"
                >
                    {t('markAllRead')}
                </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
                {visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <Icon name="bell" size={28} className="text-subtle" strokeWidth={1.5} />
                        <p className="text-sm text-muted">{t('empty')}</p>
                    </div>
                ) : (
                    visible.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClick={onNotificationClick}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-divider px-4 py-3">
                <Link
                    href="/notification"
                    className="block text-center text-sm text-primary hover:text-primary-dark transition-colors"
                >
                    {t('viewAll')}
                </Link>
            </div>

        </div>
    )
}
