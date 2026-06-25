'use client'

import {
    useAuth
} from "../../lib/auth/useAuth";

import {
    useNotifications
} from './hooks/useNotifications'

import NotificationView
    from './NotificationView'

import {
    markAllNotificationsRead
} from './services/notification.service'

export default function NotificationContainer() {

    const {
        membership
    } = useAuth()

    const {
        notifications,
        reload
    } = useNotifications()

    async function handleMarkAllRead() {

        try {

            await markAllNotificationsRead(

                membership.user.id

            )

            await reload()

        } catch (err) {

            console.error(err)
        }
    }

    return (

        <NotificationView

            notifications={
                notifications
            }

            onMarkAllRead={
                handleMarkAllRead
            }

        />

    )
}