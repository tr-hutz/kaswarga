'use client'

import { useCallback, useEffect, useState } from 'react'
import { getAllUsers } from '@/lib/services/users.service'

export function useUsersData() {

    const [data,    setData]    = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {

        setLoading(true)

        try {
            const rows = await getAllUsers()
            setData(rows)
        } catch (err) {
            console.error('[useUsersData]', err)
        } finally {
            setLoading(false)
        }

    }, [])

    useEffect(() => { load() }, [load])

    return { data, loading, refresh: load }
}
