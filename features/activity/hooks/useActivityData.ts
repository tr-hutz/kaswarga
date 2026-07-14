// @ts-nocheck
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

    const [error, setError] = useState(false)

    useEffect(() => {

        loadData()

    }, [])

    async function loadData() {

        setLoading(true)
        setError(false)

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
            setError(true)

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        error,

        rows,

        refresh:
        loadData
    }
}