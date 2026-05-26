'use client'

import {

    useEffect

} from 'react'

import {

    X

} from 'lucide-react'

import NotificationList
    from './NotificationList'

export default function NotificationDrawer({

                                               open,

                                               notifications = [],

                                               onClose

                                           }) {

    /*
     |---------------------------------------------------------
     | ESC CLOSE
     |---------------------------------------------------------
     */

    useEffect(() => {

        function handleKeyDown(e) {

            if (e.key === 'Escape') {

                onClose?.()
            }
        }

        window.addEventListener(

            'keydown',

            handleKeyDown

        )

        return () => {

            window.removeEventListener(

                'keydown',

                handleKeyDown

            )
        }

    }, [])

    if (!open) {
        return null
    }

    return (

        <div

            className="
                fixed
                inset-0
                z-50
                bg-black/20
                flex
                justify-end
            "

            onClick={onClose}
        >

            <div

                className="
                    w-full
                    max-w-md
                    bg-white
                    h-full
                    shadow-2xl
                    flex
                    flex-col
                "

                onClick={e =>
                    e.stopPropagation()
                }
            >

                <div
                    className="
                        p-4
                        border-b
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <h2
                            className="
                                font-semibold
                                text-lg
                            "
                        >
                            Notifications
                        </h2>

                    </div>

                    <button
                        onClick={onClose}
                    >

                        <X
                            className="
                                w-5
                                h-5
                            "
                        />

                    </button>

                </div>

                <div
                    className="
                        flex-1
                        overflow-y-auto
                    "
                >

                    <NotificationList

                        notifications={
                            notifications
                        }

                    />

                </div>

            </div>

        </div>
    )
}