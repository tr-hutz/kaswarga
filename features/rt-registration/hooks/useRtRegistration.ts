'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase }                          from '@/lib/supabase'
import { findRtRegistrationRequests }        from '@/lib/repositories/registration.repository'

export function useRtRegistration() {

    const [requests, setRequests] = useState<any[]>([])
    const [loading,  setLoading]  = useState(true)
    const [filter,   setFilter]   = useState('pending')
    const [error,    setError]    = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(false)
        try {
            const data = await findRtRegistrationRequests(filter)
            setRequests(data)
        } catch (err) {
            console.error('[useRtRegistration]', err)
            setError(true)
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

    return { requests, loading, error, filter, setFilter, refresh }
}