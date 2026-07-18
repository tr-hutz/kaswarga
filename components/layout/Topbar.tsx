'use client'

import Icon from '@/components/ui/Icon'
import { useAuth } from '../../lib/auth/useAuth'
import NotificationBar from '../../features/notification/components/NotificationBar'
import { logActivity } from '../../lib/services/activity-logger'
import { logout } from '../../lib/services/auth.service'
import { useTranslations } from 'next-intl'

interface TopbarProps {
    mobileOpen: boolean
    setMobileOpen: (open: boolean) => void
}

export default function Topbar({ mobileOpen, setMobileOpen }: TopbarProps) {
    const t = useTranslations('topbar')
    const { membership, role } = useAuth()

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
        <header className="fixed top-0 right-0 left-0 lg:left-72 z-40 h-16 bg-white border-b border-stroke shadow-card-2 flex items-center px-4 md:px-6 justify-between">

            {/* LEFT — hamburger + mobile brand */}
            <div className="flex items-center gap-3 lg:hidden">
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg hover:bg-body transition-colors"
                    aria-label="Toggle menu"
                >
                    {mobileOpen
                        ? <Icon name="x" size={22} />
                        : <Icon name="menu" size={22} />
                    }
                </button>
                <span className="font-semibold text-sm text-dark">{t('brand')}</span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 ml-auto">
                <NotificationBar />

                <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-dark">{membership?.user?.name}</div>
                    <div className="text-xs text-dark-5 capitalize">{role}</div>
                </div>

                <button
                    onClick={handleLogout}
                    data-testid="btn-logout"
                    className="p-2 rounded-lg hover:bg-body transition-colors text-dark-5 hover:text-dark"
                    aria-label={t('logout')}
                >
                    <Icon name="log-out" size={18} />
                </button>
            </div>
        </header>
    )
}
