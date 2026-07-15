// @ts-nocheck
'use client'

import Icon from '@/components/ui/Icon'

import {
    formatRelativeDate
} from "../../../lib/utils";

export default function NotificationItem({

                                             notification,

                                             onClick

                                         }) {

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
                hover:bg-gray-50
                transition

                ${!notification.is_read
                ? 'bg-blue-50'
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
                        text-gray-500
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
                                        bg-blue-600
                                        shrink-0
                                    "
                                />

                            )
                        }

                    </div>

                    <div
                        className="
                            text-sm
                            text-gray-600
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
                            text-gray-400
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