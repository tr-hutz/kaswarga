'use client'

import SidebarMenu

    from './SidebarMenu'

export default function Sidebar({

                                    mobileOpen,
                                    onClose

                                }) {

    return (

        <aside
            className={`
                fixed
                top-16
                left-0
                bottom-0
                w-72
                bg-white
                border-r
                z-50
                transition-transform

                ${mobileOpen

                ? 'translate-x-0'

                : '-translate-x-full'
            }

                lg:translate-x-0
            `}
        >

            <SidebarMenu

                onClose={
                    onClose
                }

            />

        </aside>
    )
}