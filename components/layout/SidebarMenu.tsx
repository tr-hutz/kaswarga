// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { usePathname }         from 'next/navigation'
import SidebarMenuItem         from './SidebarMenuItem'
import { NAVIGATION }          from '../../lib/navigation/navigation-config'
import { hasPermission }       from '../../lib/permissions/permissions'
import { useAuth }             from '../../lib/auth/useAuth'
import { supabase }            from '../../lib/supabase'

export default function SidebarMenu({ onClose }) {

    const pathname = usePathname()
    const { role, membership } = useAuth()

    const [pendingRtCount,    setPendingRtCount]    = useState(0)
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
        const rtId = membership?.rt?.id
        if (!rtId || !['CHAIR', 'ADMIN'].includes(role)) return

        function fetchCount() {
            supabase
                .from('registration_requests')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'resident')
                .eq('status', 'pending')
                .eq('rt_id', rtId)
                .then(({ count }) => setPendingResidentCount(count || 0))
        }

        fetchCount()

        const channel = supabase
            .channel('sidebar-warga-pending-count')
            .on('postgres_changes', {
                event:  '*',
                schema: 'public',
                table:  'registration_requests',
                filter: 'type=eq.resident',
            }, fetchCount)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [role, membership?.rt?.id])

    const filteredMenus = NAVIGATION.filter(item => {
        if (item.hideForRoles?.includes(role)) return false
        if (!item.permission) return true
        return hasPermission(role, item.permission)
    })

    return (
        <nav className="p-4 space-y-2">
            {filteredMenus.map(item => (
                <SidebarMenuItem
                    key={item.href}
                    item={item}
                    active={pathname === item.href}
                    badge={
                        item.href === '/rt/registration' ? pendingRtCount :
                        item.href === '/residents'       ? pendingResidentCount :
                        0
                    }
                    onClick={onClose}
                />
            ))}
        </nav>
    )
}