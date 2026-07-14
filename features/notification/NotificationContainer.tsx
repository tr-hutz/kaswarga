// @ts-nocheck
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
        loading,
        error,
        reload
    } = useNotifications()

    async function handleMarkAllRead() {

        if (!membership?.user?.id) return

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

            loading={loading}

            error={error}

            onRetry={reload}

            onMarkAllRead={
                handleMarkAllRead
            }

        />

    )
}