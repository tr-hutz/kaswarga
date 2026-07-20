'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SidebarMenuItem from './SidebarMenuItem'
import { NAVIGATION } from '../../lib/navigation/navigation-config'
import { hasPermission } from '../../lib/permissions/permissions'
import { useAuth } from '../../lib/auth/useAuth'
import { usePendingCounts } from './usePendingCounts'

export default function SidebarMenu({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname()
    const { role, membership } = useAuth()

    const { pendingRtCount, pendingResidentCount } =
        usePendingCounts(role, membership?.rt?.id)

    const filteredMenus = NAVIGATION.filter(item => {
        if (item.hideForRoles?.includes(role)) return false
        if (!item.permission) return true
        return hasPermission(role, item.permission)
    })

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
