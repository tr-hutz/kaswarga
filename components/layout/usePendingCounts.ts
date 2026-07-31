'use client'

import { useEffect, useState } from 'react'
import { supabase }            from '../../lib/supabase'
import {
    countPendingRtRegistrations,
    countPendingResidentRegistrations,
} from '../../lib/repositories/registration.repository'

export function usePendingCounts(rtId: string | undefined, canApproveResidents: boolean) {

    const [pendingRtCount,       setPendingRtCount]       = useState(0)
    const [pendingResidentCount, setPendingResidentCount] = useState(0)

    useEffect(() => {
        // RT registration badge is only for SUPER_ADMIN (no RT membership)
        if (rtId) return

        async function fetchCount() {
            try {
                const count = await countPendingRtRegistrations()
                setPendingRtCount(count)
            } catch { /* non-critical badge */ }
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
    }, [rtId])

    useEffect(() => {
        if (!rtId || !canApproveResidents) return

        async function fetchCount() {
            try {
                const count = await countPendingResidentRegistrations(rtId!)
                setPendingResidentCount(count)
            } catch { /* non-critical badge */ }
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
    }, [rtId, canApproveResidents])

    return { pendingRtCount, pendingResidentCount }
}
