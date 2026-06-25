'use client'

import {

    usePathname

} from 'next/navigation'

import SidebarMenuItem

    from './SidebarMenuItem'

import {

    NAVIGATION

} from '../../lib/navigation/navigation-config'

import {

    hasPermission

} from '../../lib/permissions/permissions'

import {

    useAuth

} from '../../lib/auth/useAuth'

export default function SidebarMenu({

                                        onClose

                                    }) {

    /*
     |-------------------------------------------------------------
     | PATHNAME
     |-------------------------------------------------------------
     */

    const pathname =
        usePathname()

    /*
     |-------------------------------------------------------------
     | AUTH
     |-------------------------------------------------------------
     */

    const {

        role

    } = useAuth()

    /*
     |-------------------------------------------------------------
     | FILTERED MENUS
     |-------------------------------------------------------------
     */

    const filteredMenus =

        NAVIGATION.filter(item => {

            if (item.hideForRoles?.includes(role)) {

                return false
            }

            if (!item.permission) {

                return true
            }

            return hasPermission(

                role,

                item.permission
            )
        })

    return (

        <nav
            className="
                p-4
                space-y-2
            "
        >

            {

                filteredMenus.map(item => (

                    <SidebarMenuItem

                        key={item.href}

                        item={item}

                        active={

                            pathname ===
                            item.href
                        }

                        onClick={
                            onClose
                        }

                    />

                ))
            }

        </nav>
    )
}