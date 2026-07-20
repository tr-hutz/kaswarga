'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    useEffect,
    useState
} from 'react'

import {
    getResidentPaymentHistory
} from '../../../lib/services/resident.service'

import {
    transformResidentAnalytics
} from '../services/resident-analytics-transform'

export function useResidentAnalytics(
    residentId: string | null | undefined,
    year: number
) {

    const [
        analytics,
        setAnalytics
    ] = useState<any[]>([])

    const [
        loading,
        setLoading
    ] = useState(true)

    useEffect(() => {

        async function loadData() {

            setLoading(true)

            try {

                const payments =
                    await getResidentPaymentHistory(
                        residentId!,
                        year
                    )

                setAnalytics(
                    transformResidentAnalytics(
                        payments as any
                    )
                )

            } catch (err) {

                console.error(err)

            } finally {

                setLoading(false)
            }
        }

        if (residentId) {
            loadData()
        }

    }, [residentId, year])

    return {
        loading,
        analytics
    }
}