'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from 'react'
import { getAllRt }                          from '@/lib/services/rt.service'

export function useRtData() {

    const [data,    setData]    = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const rows = await getAllRt()
            setData(rows)
        } catch (err) {
            console.error('[useRtData]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load() }, [load])

    function refresh() { load() }

    return { data, loading, error, refresh }
}