'use client'

import {
    useState
} from 'react'

import PengeluaranView
    from './PengeluaranView'

import {
    usePengeluaranData
} from './hooks/usePengeluaranData'

import {
    usePengeluaranActions
} from './hooks/usePengeluaranActions'

import {
    usePengeluaranRealtime
} from './hooks/usePengeluaranRealtime'

export default function PengeluaranContainer() {

    /*
     |-------------------------------------------------------------
     | FILTERS
     |-------------------------------------------------------------
     */

    const [
        search,
        setSearch
    ] = useState('')

    const [
        kategori,
        setKategori
    ] = useState('all')

    /*
     |-------------------------------------------------------------
     | DATA
     |-------------------------------------------------------------
     */

    const {

        rows,
        loading,
        refresh

    } = usePengeluaranData({

        search,
        kategori

    })

    /*
     |-------------------------------------------------------------
     | REALTIME
     |-------------------------------------------------------------
     */

    // usePengeluaranRealtime({
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
        usePengeluaranActions({

            onReload:
            refresh

        })

    /*
     |-------------------------------------------------------------
     | VIEW
     |-------------------------------------------------------------
     */

    return (

        <PengeluaranView

            /*
             * filters
             */

            search={search}
            setSearch={setSearch}

            kategori={kategori}
            setKategori={setKategori}

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