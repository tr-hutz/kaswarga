// @ts-nocheck
'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getUnreadNotificationsCount

} from '../services/notification-unread.service'

export function useUnreadNotifications({

                                           user_id

                                       }) {

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

                user_id
            })

        setUnread(count)
    }

    return {

        unread,

        refresh:
        load
    }
}