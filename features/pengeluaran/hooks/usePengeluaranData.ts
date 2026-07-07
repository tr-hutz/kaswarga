// @ts-nocheck
'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getExpenses

} from '../../../lib/services/pengeluaran.service'

export function useExpenseData({

                                       search = '',
                                       category = 'all'

                                   } = {}) {

    const [

        loading,
        setLoading

    ] = useState(true)

    const [

        rows,
        setRows

    ] = useState([])

    /*
     |-------------------------------------------------------------
     | LOAD
     |-------------------------------------------------------------
     */

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {

        loadData()

    }, [

        search,
        category

    ])
    /* eslint-enable react-hooks/exhaustive-deps */

    /*
     |-------------------------------------------------------------
     | LOAD DATA
     |-------------------------------------------------------------
     */

    async function loadData() {

        setLoading(true)

        try {

            const result =
                await getExpenses({

                    search,
                    category

                })

            setRows(
                result || []
            )

        } catch (err) {

            console.error(
                '[PENGELUARAN]',
                err
            )

        } finally {

            setLoading(false)
        }
    }

    return {

        loading,

        rows,

        refresh:
        loadData
    }
}