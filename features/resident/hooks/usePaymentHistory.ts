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
    transformPaymentHistory
} from '../services/resident-history-transform'

export function usePaymentHistory(
    residentId,
    year
) {

    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        history,
        setHistory
    ] = useState([])

    useEffect(() => {

        async function loadData() {

            setLoading(true)

            try {

                const data =
                    await getResidentPaymentHistory(
                        residentId,
                        year
                    )

                setHistory(
                    transformPaymentHistory(data)
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
        history
    }
}