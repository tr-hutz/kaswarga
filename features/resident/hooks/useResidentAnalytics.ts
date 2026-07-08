// @ts-nocheck
'use client'

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
    wargaId,
    year
) {

    const [
        analytics,
        setAnalytics
    ] = useState([])

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
                        wargaId,
                        year
                    )

                setAnalytics(
                    transformResidentAnalytics(
                        payments
                    )
                )

            } catch (err) {

                console.error(err)

            } finally {

                setLoading(false)
            }
        }

        if (wargaId) {
            loadData()
        }

    }, [wargaId, year])

    return {
        loading,
        analytics
    }
}