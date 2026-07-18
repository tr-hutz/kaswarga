'use client'

import Icon from '@/components/ui/Icon'

import {
    formatRelativeDate
} from "../../../lib/utils";

interface NotificationItemProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notification: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick?:     (n: any) => void
}

export default function NotificationItem({

                                             notification,

                                             onClick

                                         }: NotificationItemProps) {

    function getIcon() {

        switch (
            notification.type
            ) {

            case 'payment_submitted':
                return <Icon name="wallet" size={18} />

            case 'payment_approved':
                return <Icon name="check-circle" size={18} />

            case 'payment_rejected':
                return <Icon name="x-circle" size={18} />

            case 'activity':
                return <Icon name="activity" size={18} />

            default:
                return <Icon name="bell" size={18} />
        }
    }

    return (

        <button

            type="button"

            onClick={() =>
                onClick?.(
                    notification
                )
            }

            className={`
                w-full
                text-left
                px-4
                py-3
                border-b
                hover:bg-canvas
                transition

                ${!notification.is_read
                ? 'bg-primary/5'
                : ''
            }
            `}
        >

            <div
                className="
                    flex
                    gap-3
                "
            >

                <div
                    className="
                        mt-1
                        text-muted
                    "
                >
                    {getIcon()}
                </div>

                <div
                    className="
                        flex-1
                        min-w-0
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            justify-between
                            gap-2
                        "
                    >

                        <div
                            className="
                                font-medium
                                truncate
                            "
                        >
                            {
                                notification.title
                            }
                        </div>

                        {
                            !notification.is_read && (

                                <div
                                    className="
                                        w-2
                                        h-2
                                        rounded-full
                                        bg-primary
                                        shrink-0
                                    "
                                />

                            )
                        }

                    </div>

                    <div
                        className="
                            text-sm
                            text-muted
                            mt-1
                        "
                    >
                        {
                            notification.message
                        }
                    </div>

                    <div
                        className="
                            text-xs
                            text-subtle
                            mt-2
                        "
                    >
                        {
                            formatRelativeDate(
                                notification.created_at
                            )
                        }
                    </div>

                </div>

            </div>

        </button>

    )
}