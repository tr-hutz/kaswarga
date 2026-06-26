'use client'

import { useCallback, useEffect, useState } from 'react'
import { getAllRt }   from '@/lib/services/rt.service'
import { supabase }   from '@/lib/supabase'

export function useRtData() {

    const [data,            setData]            = useState([])
    const [loading,         setLoading]         = useState(true)
    const [pendingRequests, setPendingRequests] = useState([])
    const [pendingLoading,  setPendingLoading]  = useState(true)

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

    const loadPending = useCallback(async () => {
        setPendingLoading(true)
        try {
            const { data: rows, error } = await supabase
                .from('registration_requests')
                .select('*')
                .eq('type', 'rt')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
            if (error) throw error
            setPendingRequests(rows || [])
        } catch (err) {
            console.error('[useRtData] pending:', err)
        } finally {
            setPendingLoading(false)
        }
    }, [])

    useEffect(() => { load(); loadPending() }, [load, loadPending])

    function refresh() { load(); loadPending() }

    return { data, loading, pendingRequests, pendingLoading, refresh }
}
