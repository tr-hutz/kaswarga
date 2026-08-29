'use client'

import SidebarMenu from './SidebarMenu'

export default function Sidebar({
    mobileOpen,
    navOpen = true,
    onClose,
}: {
    mobileOpen: boolean
    navOpen?:   boolean
    onClose:    () => void
}) {
    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen w-72
                bg-sidebar text-white
                z-50
                transition-transform duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${navOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
            `}
        >
            <SidebarMenu onClose={onClose} />
        </aside>
    )
}
