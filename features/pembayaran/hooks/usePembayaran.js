'use client'

import {
    useEffect,
    useState
} from 'react'

import {
    getKonfirmasiPembayaran,
    approvePembayaran,
    rejectPembayaran
} from '../../../lib/services/payment.service'

export function usePembayaran() {

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

    const [
        status,
        setStatus
    ] = useState('pending')

    const [
        search,
        setSearch
    ] = useState('')

    const [
        rows,
        setRows
    ] = useState([])

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

    useEffect(() => {

        loadData()

    }, [
        year,
        status,
        search
    ])

    async function handleApprove(id) {

        try {

            await approvePembayaran(id)

            await loadData()

        } catch (err) {

            console.error(err)
        }
    }

    async function handleReject(
        id,
        alasan
    ) {

        try {

            await rejectPembayaran(
                id,
                alasan
            )

            await loadData()

        } catch (err) {

            console.error(err)
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

        handleApprove,
        handleReject
    }
}