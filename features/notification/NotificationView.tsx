// @ts-nocheck
'use client'

import {
    useMemo,
    useState
} from 'react'

import NotificationToolbar
    from './components/NotificationToolbar'

import NotificationList
    from './components/NotificationList'

export default function NotificationView({

                                             notifications,
                                             onMarkAllRead

                                         }) {

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