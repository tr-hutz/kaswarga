'use client'

import { useRouter }        from 'next/navigation'
import { useAuth }          from '../../lib/auth/useAuth'
import { useNotifications } from './hooks/useNotifications'
import NotificationView     from './NotificationView'
import { markNotificationRead, markAllNotificationsRead } from './services/notification.service'
import { getNotificationLink } from './utils/getNotificationLink'

export default function NotificationContainer() {

    const { membership } = useAuth()
    const router         = useRouter()

    const { notifications, loading, error, reload } = useNotifications()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleNotificationClick(notification: any) {
        try {
            if (!notification.is_read) {
                await markNotificationRead(notification.id)
                reload()
            }
            router.push(getNotificationLink(notification, membership?.role))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleMarkAllRead() {
        if (!membership?.user?.id) return
        try {
            await markAllNotificationsRead(membership.user.id)
            await reload()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <NotificationView
            notifications={notifications}
            loading={loading}
            error={error}
            onRetry={reload}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={handleNotificationClick}
        />
    )
}