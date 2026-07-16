'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function usePendingCounts(role: string, rtId?: string) {

    const [pendingRtCount,       setPendingRtCount]       = useState(0)
    const [pendingResidentCount, setPendingResidentCount] = useState(0)

    useEffect(() => {
        if (role !== 'SUPER_ADMIN') return

        function fetchCount() {
            supabase
                .from('registration_requests')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'rt')
                .eq('status', 'pending')
                .then(({ count }) => setPendingRtCount(count || 0))
        }

        fetchCount()

        const channel = supabase
            .channel('sidebar-rt-pending-count')
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'registration_requests',
                filter: 'type=eq.rt',
            }, fetchCount)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [role])

    useEffect(() => {
        if (!rtId || !['CHAIR', 'ADMIN'].includes(role)) return
        const id = rtId

        function fetchCount() {
            supabase
                .from('registration_requests')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'resident')
                .eq('status', 'pending')
                .eq('rt_id', id)
                .then(({ count }) => setPendingResidentCount(count || 0))
        }

        fetchCount()

        const channel = supabase
            .channel('sidebar-resident-pending-count')
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'registration_requests',
                filter: 'type=eq.resident',
            }, fetchCount)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [role, rtId])

    return { pendingRtCount, pendingResidentCount }
}
