'use client'

import {
    useState,
    useRef,
    useEffect,
} from 'react'

import { useRouter } from 'next/navigation'

import NotificationBell
    from './NotificationBell'

import NotificationDropdown
    from './NotificationDropdown'

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
    markNotificationRead,
    markAllNotificationsRead,
} from '../services/notification.service'

import {
    getNotificationLink
} from '../utils/getNotificationLink'

export default function NotificationBar() {

    const [open, setOpen] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)

    const { membership } = useAuth()
    const router         = useRouter()
    const { toast }      = useToast()

    const { notifications, reload } = useNotifications()

    useNotificationRealtime({
        user_id:  membership?.user?.id,
        onReload: reload,
        onNew: (notification) => {
            const isRejected = notification?.type === 'payment_rejected'
                || (notification?.type as string)?.endsWith('_import_rejected')
            toast({
                title:    notification?.title,
                message:  notification?.message,
                type:     isRejected ? 'error' : 'success',
                duration: 0,
                onClick:  () => router.push(getNotificationLink(notification, membership?.role))
            })
        }
    })

    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleNotificationClick(notification: any) {
        try {
            if (!notification.is_read) {
                await markNotificationRead(notification.id)
                reload()
            }
            setOpen(false)
            router.push(getNotificationLink(notification, membership?.role))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleMarkAllRead() {
        if (!membership?.user?.id) return
        try {
            await markAllNotificationsRead(membership.user.id)
            reload()
        } catch (err) {
            console.error(err)
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <div ref={containerRef} className="relative">

            <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setOpen(o => !o)}
            />

            <NotificationDropdown
                open={open}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllRead={handleMarkAllRead}
            />

        </div>
    )
}
