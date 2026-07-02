'use client'

import { useCallback, useEffect, useState } from 'react'
import { getAllRt }                          from '@/lib/services/rt.service'

export function useRtData() {

    const [data,    setData]    = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const rows = await getAllRt()
            setData(rows)
        } catch (err) {
            console.error('[useRtData]', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    function refresh() { load() }

    return { data, loading, refresh }
}