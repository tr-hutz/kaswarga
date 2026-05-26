'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getActivities

} from '../../../lib/services/activity.service'

export function useActivityData() {

    const [

        loading,
        setLoading

    ] = useState(true)

    const [

        rows,
        setRows

    ] = useState([])

    useEffect(() => {

        loadData()

    }, [])

    async function loadData() {

        setLoading(true)

        try {

            const result =
                await getActivities()

            setRows(
                result
            )

        } catch (err) {

            console.error(
                '[ACTIVITY]',
                err
            )

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        rows,

        refresh:
        loadData
    }
}