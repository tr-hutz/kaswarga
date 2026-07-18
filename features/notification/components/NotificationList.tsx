'use client'

import NotificationItem from './NotificationItem'
import { useTranslations } from 'next-intl'

interface NotificationListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifications?:        any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNotificationClick?:  (n: any) => void
}

export default function NotificationList({

                                             notifications = [],

                                             onNotificationClick

                                         }: NotificationListProps) {

    const t = useTranslations('notification')

    if (notifications.length === 0) {
        return (
            <div className="p-6 text-center text-muted">
                {t('empty')}
            </div>
        )
    }

    return (

        <div>

            {

                notifications.map(
                    notification => (

                        <NotificationItem

                            key={
                                notification.id
                            }

                            notification={
                                notification
                            }

                            onClick={
                                onNotificationClick
                            }
                        />

                    )
                )

            }

        </div>

    )
}