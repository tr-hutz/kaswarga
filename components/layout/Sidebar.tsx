'use client'

import { useState } from 'react'
import SidebarMenu from './SidebarMenu'
import type { NavState } from '../../lib/types/nav'

export default function Sidebar({
    mobileOpen,
    navState = 'full',
    onClose,
}: {
    mobileOpen: boolean
    navState?:  NavState
    onClose:    () => void
}) {
    const [hovered, setHovered] = useState(false)

    const compact = navState === 'mini' && !hovered && !mobileOpen

    return (
        <aside
            onMouseEnter={() => navState === 'mini' && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`
                fixed top-0 left-0 h-screen
                bg-sidebar text-white
                z-50
                transition-[transform,width] duration-300 ease-in-out
                ${compact ? 'w-14' : 'w-72'}
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${navState === 'hidden' ? 'lg:-translate-x-full' : 'lg:translate-x-0'}
            `}
        >
            <SidebarMenu onClose={onClose} compact={compact} />
        </aside>
    )
}
