'use client'

import {
    useEffect,
    useState
} from 'react'

import {
    getResidentPaymentHistory
} from '../../../lib/services/warga.service'

import {
    transformPaymentHistory
} from '../services/warga-history-transform'

export function usePaymentHistory(
    wargaId,
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
                        wargaId,
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

        if (wargaId) {
            loadData()
        }

    }, [wargaId, year])

    return {
        loading,
        history
    }
}