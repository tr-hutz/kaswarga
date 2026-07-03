'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getPengeluaran

} from '../../../lib/services/pengeluaran.service'

export function usePengeluaranData({

                                       search = '',
                                       kategori = 'all'

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
        kategori

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
                await getPengeluaran({

                    search,
                    kategori

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