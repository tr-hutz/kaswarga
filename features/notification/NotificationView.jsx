'use client'

import NotificationBell
    from './components/NotificationBell'

import NotificationDrawer
    from './components/NotificationDrawer'

export default function NotificationsView({

                                              notifications = [],

                                              open,
                                              setOpen

                                          }) {

    const unreadCount =

        notifications.filter(
            item => !item.isRead
        ).length

    return (

        <>

            <NotificationBell

                count={
                    unreadCount
                }

                onClick={() =>
                    setOpen(true)
                }

            />

            <NotificationDrawer

                open={open}

                notifications={
                    notifications
                }

                onClose={() =>
                    setOpen(false)
                }

            />

        </>

    )
}
