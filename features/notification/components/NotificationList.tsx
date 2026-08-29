'use client'

import NotificationItem from './NotificationItem'
import { useTranslations } from 'next-intl'
import Icon from '@/components/ui/Icon'

interface NotificationListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifications?:        any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNotificationClick?:  (n: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLink?:              (n: any) => string | null
}

export default function NotificationList({
    notifications = [],
    onNotificationClick,
    getLink,
}: NotificationListProps) {

    const t = useTranslations('notification')

    return (
        <div className="bg-surface rounded-xl shadow-card border border-divider overflow-hidden">

            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <Icon name="bell" size={32} className="text-subtle" strokeWidth={1.5} />
                    <p className="text-sm text-muted">{t('empty')}</p>
                </div>
            ) : (
                notifications.map(notification => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={onNotificationClick}
                        getLink={getLink}
                    />
                ))
            )}

        </div>
    )
}
