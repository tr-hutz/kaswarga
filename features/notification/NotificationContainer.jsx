'use client'

import {
    useState
} from 'react'

import NotificationsView
    from './NotificationView'

import {
    useNotifications
} from './hooks/useNotifications'

import {
    useNotificationRealtime
} from './hooks/useNotificationRealtime'

export default function NotificationsContainer() {

    const [

        open,
        setOpen

    ] = useState(false)

    const {

        loading,
        notifications,
        reload

    } = useNotifications()

    useNotificationRealtime({

        onReload:
        reload

    })

    return (

        <NotificationsView

            loading={
                loading
            }

            notifications={
                notifications
            }

            open={
                open
            }

            setOpen={
                setOpen
            }

        />
    )
}