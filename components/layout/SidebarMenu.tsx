'use client'

import { useMemo }     from 'react'
import { usePathname } from 'next/navigation'
import Icon            from '@/components/ui/Icon'
import SidebarMenuItem from './SidebarMenuItem'
import Ribbon, { type RibbonType } from '@/components/ui/Ribbon'
import { NAVIGATION }              from '@/lib/navigation/navigation-config'
import { PERMISSION }              from '@/lib/auth/types'
import { useAuth }                 from '@/lib/auth/useAuth'
import { usePendingCounts }        from './usePendingCounts'
import { logActivity }             from '@/lib/services/activity-logger'
import { logout }                  from '@/lib/services/auth.service'

const APP_ENV = process.env.APP_ENV ?? 'production'

// Environments that show the diagonal ribbon — production shows none
const RIBBON_ENVS = new Set<string>(['local', 'sit', 'uat', 'staging', 'preview'])

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    CHAIR:       'Ketua',
    TREASURER:   'Bendahara',
    ADMIN:       'Admin',
    RESIDENT:    'Warga',
}

const EMPTY_PERMISSIONS: ReadonlySet<string> = Object.freeze(new Set<string>())

export default function SidebarMenu({ onClose, compact = false }: { onClose?: () => void; compact?: boolean }) {
    const pathname = usePathname()
    const { permissions, rtId, membership, role } = useAuth()
    const perms: ReadonlySet<string> = permissions ?? EMPTY_PERMISSIONS
    const isSuperAdmin = membership?.role === 'SUPER_ADMIN'

    const initials = membership?.user?.name
        ?.split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? '?'

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

    async function handleLogout() {
        logActivity({
            rtId:        membership?.rt?.id,
            actorId:     membership?.user?.id,
            actorName:   membership?.user?.name,
            action:      'LOGOUT',
            entityType:  'auth',
            entityId:    membership?.user?.id,
            description: `${membership?.user?.name} logged out`,
            metadata:    { role }
        })
        await logout()
        window.location.href = '/login'
    }

    return (
        <div className="flex flex-col h-full">
            {/* Sidebar header: env ribbon in corner + user profile */}
            <div className="relative overflow-hidden h-16 shrink-0 flex items-center px-4">
                {showRibbon && (
                    <Ribbon variant="diagonal" type={APP_ENV as RibbonType} />
                )}
                {!compact && (
                    <div className="relative z-10 flex items-center gap-3 w-full min-w-0">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-white">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate leading-tight">
                                {membership?.user?.name}
                            </div>
                            <div className="text-xs text-white/60 truncate leading-tight">
                                {ROLE_LABELS[role as string] ?? role}
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            data-testid="btn-logout"
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white shrink-0"
                            aria-label="Logout"
                        >
                            <Icon name="log-out" size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sidebar p-4 space-y-1">
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
