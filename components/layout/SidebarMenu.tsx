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

export default function SidebarMenu({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname()
    const { permissions, rtId, membership } = useAuth()
    const perms: ReadonlySet<string> = permissions ?? EMPTY_PERMISSIONS

    // Memoize to avoid re-filtering NAVIGATION on every render (usePathname()
    // triggers re-renders on route changes; permissions/rtId rarely change).
    const canApproveResidents = useMemo(
        () => perms.has(PERMISSION.RESIDENT_APPROVE),
        [perms]
    )

    const { pendingRtCount, pendingResidentCount } =
        usePendingCounts(rtId, canApproveResidents)

    const filteredMenus = useMemo(() => NAVIGATION.filter(item => {
        if (item.noRt && rtId) return false
        if (item.requiresRt && !rtId) return false
        if (!item.permission) return true
        return perms.has(item.permission)
    }), [perms, rtId])

    return (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 px-6 h-16 shrink-0"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <span className="text-white font-bold text-sm">KW</span>
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-white text-sm leading-tight">KasWarga</div>
                    {membership?.rt?.name && (
                        <div className="text-xs text-white/60 truncate leading-tight">{membership.rt.name}</div>
                    )}
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
        </div>
    )
}
