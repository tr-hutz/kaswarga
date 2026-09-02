'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {

    useEffect,
    useState

} from 'react'

import {

    getUnreadNotificationsCount

} from '@/features/notification/services/notification-unread.service'

export function useUnreadNotifications({

                                           user_id

                                       }: { user_id?: string | null }) {

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [

        unread,
        setUnread

    ] = useState(0)

    /*
     |-------------------------------------------------------------
     | LOAD
     |-------------------------------------------------------------
     */

    useEffect(() => {

        if (!user_id) {

            return
        }

        load()

    }, [

        user_id
    ])

    /*
     |-------------------------------------------------------------
     | LOAD FUNCTION
     |-------------------------------------------------------------
     */

    async function load() {

        const count =

            await getUnreadNotificationsCount({

                user_id: user_id!
            })

        setUnread(count)
    }

    return {

        unread,

        refresh:
        load
    }
}