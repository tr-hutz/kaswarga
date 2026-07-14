// @ts-nocheck
'use client'

import {

    Menu,
    X,
    LogOut

} from 'lucide-react'

import {

    supabase

} from '../../lib/supabase'

import {

    useAuth

} from '../../lib/auth/useAuth'

import NotificationBar from "../../features/notification/components/NotificationBar"

import {

    logActivity

} from '../../lib/services/activity-logger'

import { useTranslations } from 'next-intl'

export default function Topbar({

                                   mobileOpen,
                                   setMobileOpen

                               }) {

    /*
     |-------------------------------------------------------------
     | AUTH
     |-------------------------------------------------------------
     */

    const t = useTranslations('topbar')

    const {

        membership,
        role

    } = useAuth()

    /*
     |-------------------------------------------------------------
     | LOGOUT
     |-------------------------------------------------------------
     */

    async function handleLogout() {

        logActivity({
            rtId:       membership?.rt?.id,
            actorId:    membership?.user?.id,
            actorName:  membership?.user?.name,
            action:     'LOGOUT',
            entityType: 'auth',
            entityId:   membership?.user?.id,
            description: `${membership?.user?.name} logged out`,
            metadata:   { role }
        })

        await supabase.auth.signOut()

        window.location.href =
            '/login'
    }

    return (

        <header
            className="
                sticky
                top-0
                z-50
                bg-white
                border-b
            "
        >

            <div
                className="
                    h-16
                    px-4
                    flex
                    items-center
                    justify-between
                "
            >

                {/* LEFT */}

                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >

                    {/* MOBILE BUTTON */}

                    <button

                        onClick={() =>

                            setMobileOpen(
                                !mobileOpen
                            )
                        }

                        className="
                            lg:hidden
                        "
                    >

                        {

                            mobileOpen

                                ? <X size={22} />

                                : <Menu size={22} />
                        }

                    </button>

                    {/* BRAND */}

                    <div>

                        <div
                            className="
                                font-bold
                            "
                        >

                            {t('brand')}

                        </div>

                        <div
                            className="
                                text-xs
                                text-gray-500
                            "
                        >

                            {

                                membership?.rt
                                    ?.name
                            }

                        </div>

                    </div>

                </div>

                {/* RIGHT */}

                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >

                    <NotificationBar />

                    <div
                        className="
                            hidden
                            md:block
                            text-right
                        "
                    >

                        <div
                            className="
                                text-sm
                                font-medium
                            "
                        >

                            {

                                membership?.user
                                    ?.name
                            }

                        </div>

                        <div
                            className="
                                text-xs
                                text-gray-500
                                capitalize
                            "
                        >

                            {role}

                        </div>

                    </div>

                    <button

                        onClick={
                            handleLogout
                        }

                        data-testid="btn-logout"
                        className="
                            p-2
                            rounded-lg
                            hover:bg-gray-100
                        "
                    >

                        <LogOut
                            size={18}
                        />

                    </button>

                </div>

            </div>

        </header>
    )
}