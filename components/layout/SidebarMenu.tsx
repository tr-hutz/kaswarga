'use client'

import Link from 'next/link'
import { useMemo }     from 'react'
import { usePathname } from 'next/navigation'
import SidebarMenuItem from './SidebarMenuItem'
import { NAVIGATION } from '../../lib/navigation/navigation-config'
import { PERMISSION }  from '../../lib/auth/types'
import { useAuth }     from '../../lib/auth/useAuth'
import { usePendingCounts } from './usePendingCounts'

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

    return (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <Link
                href="/"
                onClick={onClose}
                className={`flex items-center h-16 shrink-0 transition-all duration-300 ${compact ? 'justify-center px-0' : 'gap-3 px-6'}`}
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <span className="text-white font-bold text-sm">KW</span>
                </div>
                <div className={`min-w-0 overflow-hidden transition-all duration-300 ${compact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <div className="font-semibold text-white text-sm leading-tight whitespace-nowrap">KasWarga</div>
                    {membership?.rt?.name && (
                        <div className="text-xs text-white/60 truncate leading-tight">{membership.rt.name}</div>
                    )}
                </div>
            </Link>

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
