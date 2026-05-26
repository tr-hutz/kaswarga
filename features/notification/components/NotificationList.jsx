'use client'

import NotificationItem
    from './NotificationItem'

export default function NotificationList({

                                             notifications = []

                                         }) {

    return (

        <div
            className="
                bg-white
                rounded-2xl
                border
                shadow-xl
                w-[380px]
                max-h-[500px]
                overflow-y-auto
            "
        >

            <div
                className="
                    p-4
                    border-b
                    font-semibold
                "
            >
                Notifications
            </div>

            {

                notifications.map(item => (

                    <NotificationItem

                        key={item.id}

                        item={item}

                    />

                ))
            }

        </div>
    )
}