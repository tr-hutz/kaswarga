// @ts-nocheck
'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getLedger

} from '../../../lib/services/ledger.service'

export function useLedgerData({

                                  search = ''

                              } = {}) {

    const [

        loading,
        setLoading

    ] = useState(true)

    const [

        rows,
        setRows

    ] = useState([])

    const [error, setError] = useState(false)

    /*
     |-------------------------------------------------------------
     | LOAD
     |-------------------------------------------------------------
     */

    useEffect(() => {

        loadData()

    }, [

        search

    ])

    /*
     |-------------------------------------------------------------
     | LOAD DATA
     |-------------------------------------------------------------
     */

    async function loadData() {

        setLoading(true)
        setError(false)

        try {

            const result =
                await getLedger({

                    search

                })

            setRows(
                result || []
            )

        } catch (err) {

            console.error(
                '[LEDGER]',
                err
            )
            setError(true)

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        error,

        rows,

        refresh:
        loadData
    }
}