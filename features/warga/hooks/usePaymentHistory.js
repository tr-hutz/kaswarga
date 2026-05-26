'use client'

import {
    useEffect,
    useState
} from 'react'

import {
    getWargaPaymentHistory
} from '../../../lib/services/warga.service'

import {
    transformPaymentHistory
} from '../services/warga-history-transform'

export function usePaymentHistory(
    wargaId,
    tahun
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
                    await getWargaPaymentHistory(
                        wargaId,
                        tahun
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

    }, [wargaId, tahun])

    return {
        loading,
        history
    }
}