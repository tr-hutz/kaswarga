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
    residentId: string | null | undefined,
    year: number
) {

    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        history,
        setHistory
    ] = useState<any[]>([])

    useEffect(() => {

        async function loadData() {

            setLoading(true)

            try {

                const data =
                    await getResidentPaymentHistory(
                        residentId!,
                        year
                    )

                setHistory(
                    transformPaymentHistory(data as any)
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