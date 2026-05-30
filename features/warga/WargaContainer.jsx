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

    ] = useState('aktif')

    /*
     |---------------------------------------------------------------
     | DATA
     |---------------------------------------------------------------
     */

    const {

        data,
        loading,
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

    const actions =
        useWargaActions()

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