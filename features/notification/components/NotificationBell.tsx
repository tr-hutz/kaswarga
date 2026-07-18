'use client'

import Icon from '@/components/ui/Icon'

interface NotificationBellProps {
    unreadCount?: number
    onClick?:     () => void
}

export default function NotificationBell({

                                             unreadCount = 0,

                                             onClick

                                         }: NotificationBellProps) {

    return (

        <button

            onClick={onClick}

            className="
                relative

                p-2

                rounded-lg

                hover:bg-body
            "
        >

            <Icon name="bell" size={20} />

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

                            bg-danger
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