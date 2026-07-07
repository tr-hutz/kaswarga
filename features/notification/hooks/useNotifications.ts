// @ts-nocheck
'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getNotifications

} from '../../../lib/services/notification.service'

export function useNotifications() {

    const [

        loading,
        setLoading

    ] = useState(true)

    const [

        notifications,
        setNotifications

    ] = useState([])

    useEffect(() => {

        loadData()

    }, [])

    async function loadData() {

        try {

            const data =
                await getNotifications()

            setNotifications(
                data
            )

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        notifications,

        reload:
        loadData
    }
}