'use client'

import {
    useState
} from 'react'

import {
    useWargaData
} from './hooks/useWargaData'

import {
    useWargaActions
} from './hooks/useWargaActions'

import { useToast } from '@/components/ui/ToastProvider'

import WargaView
    from './WargaView'

export default function WargaContainer() {

    /*
     |---------------------------------------------------------------
     | FILTERS
     |---------------------------------------------------------------
     */

    const [
        search,
        setSearch
    ] = useState('')

    const [

        status,
        setStatus

    ] = useState('active')

    /*
     |---------------------------------------------------------------
     | DATA
     |---------------------------------------------------------------
     */

    const {

        data,
        loading,
        pendingRequests,
        pendingLoading,
        refresh

    } = useWargaData({

        search,
        status

    })

    /*
     |---------------------------------------------------------------
     | ACTIONS
     |---------------------------------------------------------------
     */

    const { toast } = useToast()

    const actions = useWargaActions((inserted) => {
        refresh()
        toast({ message: `${inserted} data warga berhasil diimpor.`, type: 'success' })
    })

    return (

        <WargaView

            /*
             |-----------------------------------------------------------
             | DATA
             |-----------------------------------------------------------
             */

            data={data}

            loading={loading}

            refresh={refresh}

            pendingRequests={pendingRequests}

            pendingLoading={pendingLoading}

            /*
             |-----------------------------------------------------------
             | FILTERS
             |-----------------------------------------------------------
             */

            search={search}
            setSearch={setSearch}

            status={status}
            setStatus={setStatus}

            /*
             |-----------------------------------------------------------
             | ACTIONS
             |-----------------------------------------------------------
             */

            {...actions}

        />

    )
}