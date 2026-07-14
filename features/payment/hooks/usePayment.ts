// @ts-nocheck
'use client'

import {
    useEffect,
    useState
} from 'react'

import { useSearchParams } from 'next/navigation'

import {
    getPaymentConfirmations
} from '../../../lib/services/payment.service'

const VALID_STATUSES = ['pending', 'approved', 'rejected']

export function usePayment() {

    const searchParams = useSearchParams()

    const currentYear =
        new Date()
            .getFullYear()

    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        year,
        setYear
    ] = useState(
        currentYear
    )

    const urlStatus = searchParams.get('status')

    const [
        status,
        setStatus
    ] = useState(
        VALID_STATUSES.includes(urlStatus) ? urlStatus : 'pending'
    )

    // Sync filter when navigating to the page with a ?status= param
    useEffect(() => {
        const s = searchParams.get('status')
        if (VALID_STATUSES.includes(s)) {
            setStatus(s)
        }
    }, [searchParams])

    const [
        search,
        setSearch
    ] = useState('')

    const [
        rows,
        setRows
    ] = useState([])

    const [error, setError] = useState(false)

    useEffect(() => {

        loadData()

    }, [
        year,
        status,
        search
    ])

    async function loadData() {

        setLoading(true)
        setError(false)

        try {

            const data =
                await getPaymentConfirmations({

                    year,
                    status,
                    search

                })

            setRows(data)

        } catch (err) {

            console.error(err)
            setError(true)

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        error,

        year,
        setYear,

        status,
        setStatus,

        search,
        setSearch,

        rows,
        loadData
    }
}