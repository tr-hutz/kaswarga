// @ts-nocheck
'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getExpenses

} from '../../../lib/services/expense.service'

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

    const [error, setError] = useState(false)

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
        setError(false)

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