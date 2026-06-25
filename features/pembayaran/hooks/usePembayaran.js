'use client'

import {
    useEffect,
    useState
} from 'react'

import { useSearchParams } from 'next/navigation'

import {
    getKonfirmasiPembayaran
} from '../../../lib/services/payment.service'

const VALID_STATUSES = ['pending', 'approved', 'rejected']

export function usePembayaran() {

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

    useEffect(() => {

        loadData()

    }, [
        year,
        status,
        search
    ])

    async function loadData() {

        setLoading(true)

        try {

            const data =
                await getKonfirmasiPembayaran({

                    tahun: year,
                    status,
                    search

                })

            setRows(data)

        } catch (err) {

            console.error(err)

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

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