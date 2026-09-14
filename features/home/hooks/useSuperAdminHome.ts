'use client'

import { useEffect, useState } from 'react'
import { findAllRt }                    from '@/lib/repositories/rt.repository'
import { findAllUsersWithMemberships }  from '@/lib/repositories/user.repository'
import { countPendingRtRegistrations }  from '@/lib/repositories/registration.repository'
import { findActivities }               from '@/lib/repositories/activity.repository'
import type { Database }                from '@/types/database'

const SYSTEM_RT_ID = '00000000-0000-0000-0000-000000000001'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

export interface SuperAdminStats {
    totalRt:    number
    pendingRt:  number
    totalUsers: number
}

export function useSuperAdminHome() {
    const [stats,    setStats]    = useState<SuperAdminStats>({ totalRt: 0, pendingRt: 0, totalUsers: 0 })
    const [activity, setActivity] = useState<ActivityLog[]>([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(false)

    async function load() {
        setLoading(true)
        setError(false)
        try {
            const [rts, pendingRt, users, recentActivity] = await Promise.all([
                findAllRt(),
                countPendingRtRegistrations(),
                findAllUsersWithMemberships(),
                findActivities({ rtId: SYSTEM_RT_ID, limit: 8 }),
            ])
            setStats({
                totalRt:    rts.length,
                pendingRt,
                totalUsers: users.length,
            })
            setActivity(recentActivity)
        } catch (err) {
            console.error('[SUPER_ADMIN_HOME]', err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load() }, [])

    return { stats, activity, loading, error, reload: load }
}
