'use client'

import {
    useKeyDown
} from '../../../lib/hooks/useKeyDown'

import Icon from '@/components/ui/Icon'

import NotificationList
    from './NotificationList'

import {
    useRouter
} from 'next/navigation'

import { useTranslations } from 'next-intl'

import {

    markNotificationRead

} from '../services/notification.service'

import {

    getNotificationLink

} from '../utils/getNotificationLink'

interface NotificationDrawerProps {
    open:          boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifications?: any[]
    onClose?:      () => void
    onRead?:       () => void
}

export default function NotificationDrawer({

                                               open,

                                               notifications = [],

                                               onClose,

                                               onRead

                                           }: NotificationDrawerProps) {

    const router =
        useRouter()

    const t = useTranslations('notification')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleClick(notification: any) {

        try {

            if (
                !notification.is_read
            ) {

                await markNotificationRead(
                    notification.id
                )

                onRead?.()
            }

            onClose?.()

            router.push(

                getNotificationLink(
                    notification
                )

            )

        } catch (err) {

            console.error(err)
        }
    }

    useKeyDown(open, { Escape: onClose })

    if (!open) {
        return null
    }

    return (

        <div

            className="
                fixed
                inset-0
                z-50
                bg-black/20
                flex
                justify-end
            "

            onClick={onClose}
        >

            <div

                className="
                    w-full
                    max-w-md
                    bg-white
                    h-full
                    shadow-default
                    flex
                    flex-col
                "

                onClick={e =>
                    e.stopPropagation()
                }
            >

                <div
                    className="
                        p-4
                        border-b
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <h2
                            className="
                                font-semibold
                                text-lg
                            "
                        >
                            {t('title')}
                        </h2>

                    </div>

                    <button
                        onClick={onClose}
                    >

                        <Icon name="x" className="w-5 h-5" />

                    </button>

                </div>

                <div
                    className="
                        flex-1
                        overflow-y-auto
                    "
                >

                    <NotificationList

                        notifications={
                            notifications
                        }

                        onNotificationClick={
                            handleClick
                        }

                    />

                </div>

            </div>

        </div>
    )
}