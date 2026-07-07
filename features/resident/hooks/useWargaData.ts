// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getResidents }        from '../../../lib/services/resident.service'
import { supabase }            from '../../../lib/supabase'
import { useAuth }             from '../../../lib/auth/useAuth'

export function useResidentData({ search = '', status = 'aktif' } = {}) {

    const { membership } = useAuth()

    const [loading,         setLoading]         = useState(true)
    const [data,            setData]            = useState([])
    const [pendingRequests, setPendingRequests] = useState([])
    const [pendingLoading,  setPendingLoading]  = useState(true)

    useEffect(() => { loadData() }, [search, status])

    useEffect(() => {
        if (membership?.rt?.id) loadPending()
    }, [membership?.rt?.id])

    useEffect(() => {
        const rtId = membership?.rt?.id
        if (!rtId) return

        const channel = supabase
            .channel('warga-pending-requests')
            .on('postgres_changes', {
                event:  'INSERT',
                schema: 'public',
                table:  'registration_requests',
                filter: `type=eq.warga`,
            }, () => loadPending())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [membership?.rt?.id])

    async function loadData() {
        setLoading(true)
        try {
            const result = await getResidents({ search, status })
            setData(result || [])
        } catch (err) {
            console.error('[WARGA]', err)
        } finally {
            setLoading(false)
        }
    }

    async function loadPending() {
        if (!membership?.rt?.id) return
        setPendingLoading(true)
        try {
            const { data: rows, error } = await supabase
                .from('registration_requests')
                .select('*')
                .eq('type', 'warga')
                .eq('status', 'pending')
                .eq('rt_id', membership.rt.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setPendingRequests(rows || [])
        } catch (err) {
            console.error('[WARGA] pending:', err)
        } finally {
            setPendingLoading(false)
        }
    }

    function refresh() { loadData(); loadPending() }

    return {
        loading,
        data,
        pendingRequests,
        pendingLoading,
        refresh
    }
}