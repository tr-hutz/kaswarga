'use client'

import { useMemo }     from 'react'
import { usePathname } from 'next/navigation'
import SidebarMenuItem from './SidebarMenuItem'
import Ribbon, { type RibbonType } from '@/components/ui/Ribbon'
import { NAVIGATION }              from '@/lib/navigation/navigation-config'
import { PERMISSION }              from '@/lib/auth/types'
import { useAuth }                 from '@/lib/auth/useAuth'
import { usePendingCounts }        from './usePendingCounts'

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'production'

// Environments that show the diagonal ribbon — production shows none
const RIBBON_ENVS = new Set<string>(['local', 'sit', 'uat', 'staging', 'preview'])

const EMPTY_PERMISSIONS: ReadonlySet<string> = Object.freeze(new Set<string>())

export default function SidebarMenu({ onClose, compact = false }: { onClose?: () => void; compact?: boolean }) {
    const pathname = usePathname()
    const { permissions, rtId, membership } = useAuth()
    const perms: ReadonlySet<string> = permissions ?? EMPTY_PERMISSIONS
    const isSuperAdmin = membership?.role === 'SUPER_ADMIN'

    // Memoize to avoid re-filtering NAVIGATION on every render (usePathname()
    // triggers re-renders on route changes; permissions/rtId rarely change).
    const canApproveResidents = useMemo(
        () => isSuperAdmin || perms.has(PERMISSION.RESIDENT_APPROVE),
        [isSuperAdmin, perms]
    )

    const { pendingRtCount, pendingResidentCount } =
        usePendingCounts(rtId, canApproveResidents)

    const filteredMenus = useMemo(() => NAVIGATION.filter(item => {
        // noRt items belong to SUPER_ADMIN; RT members never see them
        if (item.noRt && !isSuperAdmin) return false
        // requiresRt items belong to RT members; SUPER_ADMIN never sees them
        if (item.requiresRt && isSuperAdmin) return false
        if (!item.permission) return true
        // SUPER_ADMIN bypasses permission checks — mirrors SuperAdminPermissionSet
        if (isSuperAdmin) return true
        return perms.has(item.permission)
    }), [isSuperAdmin, perms])

    const showRibbon = RIBBON_ENVS.has(APP_ENV)

    return (
        <div className="flex flex-col h-full">
            {/* Env header — replaces old brand link */}
            <div className="relative overflow-hidden h-16 shrink-0">
                {showRibbon ? (
                    <Ribbon variant="diagonal" type={APP_ENV as RibbonType} />
                ) : (
                    /* Production: KW square centered */
                    <div className="flex items-center justify-center h-full">
                        <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary">
                            <span className="text-white font-bold text-sm">KW</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-1">
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
                        compact={compact}
                    />
                ))}
            </nav>

        </div>
    )
}
