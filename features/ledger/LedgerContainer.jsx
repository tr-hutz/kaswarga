'use client'

import {
    useState
} from 'react'

import LedgerView
    from './LedgerView'

import {
    useLedgerData
} from './hooks/useLedgerData'

import {
    useLedgerActions
} from './hooks/useLedgerActions'

import {
    useLedgerRealtime
} from './hooks/useLedgerRealtime'

export default function LedgerContainer() {

    /*
     |-------------------------------------------------------------
     | FILTERS
     |-------------------------------------------------------------
     */

    const [
        search,
        setSearch
    ] = useState('')

    /*
     |-------------------------------------------------------------
     | DATA
     |-------------------------------------------------------------
     */

    const {

        rows,
        loading,
        refresh

    } = useLedgerData({

        search

    })

    /*
     |-------------------------------------------------------------
     | REALTIME
     |-------------------------------------------------------------
     */

    // useLedgerRealtime({
    //
    //     onReload:
    //     refresh
    //
    // })

    /*
     |-------------------------------------------------------------
     | ACTIONS
     |-------------------------------------------------------------
     */

    const actions =
        useLedgerActions()

    /*
     |-------------------------------------------------------------
     | VIEW
     |-------------------------------------------------------------
     */

    return (

        <LedgerView

            /*
             * filters
             */

            search={search}
            setSearch={setSearch}

            /*
             * data
             */

            rows={rows}
            loading={loading}

            /*
             * actions
             */

            {...actions}

        />

    )
}