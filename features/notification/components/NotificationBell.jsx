'use client'

import {
    Bell
} from 'lucide-react'

export default function NotificationBell({

                                             unreadCount = 0,

                                             onClick

                                         }) {

    return (

        <button

            onClick={onClick}

            className="
                relative

                p-2

                rounded-lg

                hover:bg-gray-100
            "
        >

            <Bell size={20} />

            {
                unreadCount > 0 && (

                    <span
                        className="
                            absolute

                            -top-1
                            -right-1

                            min-w-[18px]
                            h-[18px]

                            px-1

                            rounded-full

                            bg-red-500
                            text-white

                            text-[10px]

                            flex
                            items-center
                            justify-center
                        "
                    >

                        {
                            unreadCount > 99
                                ? '99+'
                                : unreadCount
                        }

                    </span>

                )
            }

        </button>

    )
}