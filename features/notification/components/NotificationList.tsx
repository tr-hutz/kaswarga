// @ts-nocheck
'use client'

import NotificationItem
    from './NotificationItem'

export default function NotificationList({

                                             notifications = [],

                                             onNotificationClick

                                         }) {

    if (
        notifications.length === 0
    ) {

        return (

            <div
                className="
                    p-6
                    text-center
                    text-gray-500
                "
            >

                Tidak ada notifikasi

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