'use client'

import {

    Bell

} from 'lucide-react'

export default function NotificationBell({

                                             count = 0,

                                             onClick

                                         }) {

    return (

        <button

            onClick={onClick}

            className="
                relative
            "
        >

            <Bell
                className="
                    w-6
                    h-6
                "
            />

            {

                count > 0 && (

                    <span
                        className="
                            absolute
                            -top-1
                            -right-1
                            w-5
                            h-5
                            rounded-full
                            bg-red-500
                            text-white
                            text-xs
                            flex
                            items-center
                            justify-center
                        "
                    >

                        {count}

                    </span>
                )
            }

        </button>
    )
}