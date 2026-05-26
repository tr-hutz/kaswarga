'use client'

import {

    useEffect,
    useState

} from 'react'

import {

    getWarga

} from '../../../lib/services/warga.service'

export function useWargaData({

                                 search = '',
                                 status = 'aktif'

                             } = {}) {

    /*
     |-------------------------------------------------------------
     | STATE
     |-------------------------------------------------------------
     */

    const [

        loading,
        setLoading

    ] = useState(true)

    const [

        data,
        setData

    ] = useState([])

    /*
     |-------------------------------------------------------------
     | LOAD
     |-------------------------------------------------------------
     */

    useEffect(() => {

        loadData()

    }, [

        search,
        status

    ])

    /*
     |-------------------------------------------------------------
     | LOAD DATA
     |-------------------------------------------------------------
     */

    async function loadData() {

        setLoading(true)

        try {

            const result =
                await getWarga({

                    search,
                    status

                })

            setData(
                result || []
            )

        } catch (err) {

            console.error(
                '[WARGA]',
                err
            )

        } finally {

            setLoading(false)
        }
    }

    /*
     |-------------------------------------------------------------
     | RETURN
     |-------------------------------------------------------------
     */

    return {

        loading,

        data,

        refresh:
        loadData

    }
}