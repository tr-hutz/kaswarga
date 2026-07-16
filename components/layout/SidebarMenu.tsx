'use client'

import { usePathname }         from 'next/navigation'
import SidebarMenuItem         from './SidebarMenuItem'
import { NAVIGATION }          from '../../lib/navigation/navigation-config'
import { hasPermission }       from '../../lib/permissions/permissions'
import { useAuth }             from '../../lib/auth/useAuth'
import { usePendingCounts }    from './usePendingCounts'

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