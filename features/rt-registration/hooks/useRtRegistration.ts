// @ts-nocheck
'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase }                          from '@/lib/supabase'

export function useRtRegistration() {

    const [requests, setRequests] = useState([])
    const [loading,  setLoading]  = useState(true)
    const [filter,   setFilter]   = useState('pending')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('registration_requests')
                .select('*')
                .eq('type', 'rt')
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query
            if (error) throw error
            setRequests(data || [])
        } catch (err) {
            console.error('[useRtRegistration]', err)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        const channel = supabase
            .channel('rt-registrasi-list')
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'registration_requests',
                filter: 'type=eq.rt',
            }, () => load())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [load])

    function refresh() { load() }

    return { requests, loading, filter, setFilter, refresh }
}