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

    const [error, setError] = useState(false)

    useEffect(() => {

        loadData()

    }, [])

    async function loadData() {

        setError(false)

        try {

            const data =
                await getNotifications()

            setNotifications(
                data
            )

        } catch (err) {

            console.error('[NOTIFICATION]', err)
            setError(true)

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        error,

        notifications,

        reload:
        loadData
    }
}