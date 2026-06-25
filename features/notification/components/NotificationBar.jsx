'use client'

import {
    useState
} from 'react'

import { useRouter } from 'next/navigation'

import NotificationBell
    from './NotificationBell'

import NotificationDrawer
    from './NotificationDrawer'

import {
    useNotifications
} from '../hooks/useNotifications'

import {
    useNotificationRealtime
} from '../hooks/useNotificationRealtime'

import {
    useAuth
} from '../../../lib/auth/useAuth'

import {
    useToast
} from '../../../components/ui/ToastProvider'

import {
    getNotificationLink
} from '../utils/getNotificationLink'

export default function NotificationBar() {

    const [
        open,
        setOpen
    ] = useState(false)

    const {
        membership
    } = useAuth()

    const router = useRouter()

    const {
        toast
    } = useToast()

    const {
        notifications,
        reload
    } = useNotifications()

    useNotificationRealtime({
        user_id: membership?.user?.id,
        onReload: reload,
        onNew: (notification) => {
            const isRejected = notification?.type === 'payment_rejected'
            toast({
                title: notification?.title,
                message: notification?.message,
                type: isRejected ? 'error' : 'success',
                duration: 0,
                onClick: () => router.push(getNotificationLink(notification))
            })
        }
    })

    const unreadCount =

        notifications.filter(
            n => !n.is_read
        ).length

    return (

        <>

            <NotificationBell

                unreadCount={
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

                onRead={reload}

            />

        </>

    )
}
