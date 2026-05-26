'use client'

import {
    useEffect,
    useState
} from 'react'

import {
    getWargaPaymentHistory
} from '../../../lib/services/warga.service'

import {
    transformWargaAnalytics
} from '../services/warga-analytics-transform'

export function useWargaAnalytics(
    wargaId,
    tahun
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

                const pembayaran =
                    await getWargaPaymentHistory(
                        wargaId,
                        tahun
                    )

                setAnalytics(
                    transformWargaAnalytics(
                        pembayaran
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

    }, [wargaId, tahun])

    return {
        loading,
        analytics
    }
}