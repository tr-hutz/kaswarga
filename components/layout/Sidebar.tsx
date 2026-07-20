'use client'

import SidebarMenu from './SidebarMenu'

export default function Sidebar({
    mobileOpen,
    onClose,
}: {
    mobileOpen: boolean
    onClose: () => void
}) {
    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen w-72
                bg-sidebar text-white
                z-50
                transition-transform duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            <SidebarMenu onClose={onClose} />
        </aside>
    )
}
