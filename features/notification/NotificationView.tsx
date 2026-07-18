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
    notifications: any[]
    loading:       boolean
    error:         boolean
    onRetry:       () => void
    onMarkAllRead: () => void
}

export default function NotificationView({

                                             notifications,
                                             loading,
                                             error,
                                             onRetry,
                                             onMarkAllRead

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
            <div className="p-6 text-sm text-dark-6">
                {t('loading')}
            </div>
        )
    }

    if (error) {
        return <ErrorState onRetry={onRetry} />
    }

    return (

        <div
            className="
                p-6
                space-y-6
            "
        >

            <NotificationToolbar

                search={search}
                setSearch={setSearch}

                filter={filter}
                setFilter={setFilter}

                onMarkAllRead={onMarkAllRead}

            />

            <NotificationList

                notifications={
                    filtered
                }

            />

        </div>

    )
}