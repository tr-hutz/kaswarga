// @ts-nocheck
'use client'

import NotificationItem from './NotificationItem'
import { useTranslations } from 'next-intl'

export default function NotificationList({

                                             notifications = [],

                                             onNotificationClick

                                         }) {

    const t = useTranslations('notification')

    if (notifications.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
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