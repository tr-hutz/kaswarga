'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/lib/auth/useAuth'
import NotificationBar from '@/features/notification/components/NotificationBar'
import { logActivity } from '@/lib/services/activity-logger'
import { logout } from '@/lib/services/auth.service'
import { useTranslations } from 'next-intl'
import type { NavState } from '@/lib/types/nav'
import CommandPalette from './CommandPalette'

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    CHAIR:       'Ketua',
    TREASURER:   'Bendahara',
    ADMIN:       'Admin',
    RESIDENT:    'Warga',
}

interface TopbarProps {
    mobileOpen:   boolean
    setMobileOpen: (open: boolean) => void
    navState?:    NavState
    onNavToggle?: () => void
}

export default function Topbar({ mobileOpen, setMobileOpen, navState = 'full', onNavToggle }: TopbarProps) {
    const t = useTranslations('topbar')
    const { membership, role } = useAuth()
    const [paletteOpen, setPaletteOpen] = useState(false)

    // Global Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setPaletteOpen(open => !open)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

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
        <>
        <header className={`fixed top-0 right-0 z-40 h-16 bg-header border-b border-divider shadow-card-2 flex items-center px-4 md:px-6 justify-between transition-[left] duration-300 ease-in-out left-0 ${navState === 'full' ? 'lg:left-72' : navState === 'mini' ? 'lg:left-14' : 'lg:left-0'}`}>

            {/* LEFT — desktop nav toggle + brand / mobile hamburger */}
            <div className="flex items-center gap-2">
                {/* Desktop: toggle + brand */}
                <div className="hidden lg:flex items-center gap-2">
                    {onNavToggle && (
                        <button
                            onClick={onNavToggle}
                            className="p-2 rounded-lg hover:bg-canvas transition-colors text-muted hover:text-foreground"
                            aria-label={t('navToggle')}
                        >
                            <Icon name={navState === 'full' ? 'panel-left-close' : navState === 'mini' ? 'panel-left' : 'panel-left-open'} size={20} />
                        </button>
                    )}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary shrink-0">
                            <span className="text-white font-bold text-xs leading-none">KW</span>
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-sm text-foreground">{t('brand')}</span>
                            {membership?.rt?.name && (
                                <span className="text-xs text-muted truncate max-w-[140px]">{membership.rt.name}</span>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Mobile hamburger + brand */}
                <div className="flex items-center gap-3 lg:hidden">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-lg hover:bg-canvas transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen
                            ? <Icon name="x" size={22} />
                            : <Icon name="menu" size={22} />
                        }
                    </button>
                    <span className="font-semibold text-sm text-foreground">{t('brand')}</span>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 ml-auto">
                {/* Search / command palette */}
                <button
                    onClick={() => setPaletteOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-divider bg-canvas text-muted hover:text-foreground hover:border-muted transition-colors text-sm"
                    aria-label={t('search')}
                >
                    <Icon name="search" size={15} />
                    <span className="hidden md:inline text-xs">{t('search')}</span>
                    <kbd className="hidden md:flex items-center text-xs border border-divider rounded px-1 py-0.5 font-mono leading-none">⌘K</kbd>
                </button>

                <NotificationBar />

                <ThemeToggle />

                <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-foreground">{membership?.user?.name}</div>
                    <div className="text-xs text-muted">{ROLE_LABELS[role as string] ?? role}</div>
                </div>

                <button
                    onClick={handleLogout}
                    data-testid="btn-logout"
                    className="p-2 rounded-lg hover:bg-canvas transition-colors text-muted hover:text-foreground"
                    aria-label={t('logout')}
                >
                    <Icon name="log-out" size={18} />
                </button>
            </div>
        </header>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </>
    )
}
