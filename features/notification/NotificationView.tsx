'use client'

import {
    useMemo,
    useState
} from 'react'

import { useTranslations } from 'next-intl'

import NotificationToolbar
    from './components/NotificationToolbar'

import NotificationList
    from './components/NotificationList'

import ErrorState from '@/components/ui/ErrorState'

interface NotificationViewProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifications:          any[]
    loading:                boolean
    error:                  boolean
    onRetry:                () => void
    onMarkAllRead:          () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNotificationClick?:   (n: any) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLink?:               (n: any) => string | null
}

export default function NotificationView({

                                             notifications,
                                             loading,
                                             error,
                                             onRetry,
                                             onMarkAllRead,
                                             onNotificationClick,
                                             getLink,

                                         }: NotificationViewProps) {

    const t = useTranslations('notification')

    const [
        search,
        setSearch
    ] = useState('')

    const [
        filter,
        setFilter
    ] = useState('all')

    const filtered =
        useMemo(() => {

            return notifications.filter(
                item => {

                    const matchSearch =

                        (item.title || '')
                            .toLowerCase()
                            .includes(
                                search.toLowerCase()
                            )

                        ||

                        (item.message || '')
                            .toLowerCase()
                            .includes(
                                search.toLowerCase()
                            )

                    const matchFilter =

                        filter === 'all'

                        ||

                        (
                            filter === 'unread'
                            &&
                            !item.is_read
                        )

                    return (
                        matchSearch
                        &&
                        matchFilter
                    )
                }
            )

        }, [

            notifications,
            search,
            filter

        ])

    if (loading) {
        return (
            <div className="bg-surface rounded-xl shadow-card border border-divider flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-divider border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    if (error) {
        return <ErrorState onRetry={onRetry} />
    }

    return (

        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                <p className="text-sm text-muted">{t('subtitle')}</p>
            </div>

            <NotificationToolbar

                search={search}
                setSearch={setSearch}

                filter={filter}
                setFilter={setFilter}

                onMarkAllRead={onMarkAllRead}

            />

            <NotificationList

                notifications={filtered}
                onNotificationClick={onNotificationClick}
                getLink={getLink}

            />

        </div>

    )
}