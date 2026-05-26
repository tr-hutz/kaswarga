'use client'

export default function NotificationItem({

                                             item

                                         }) {

    return (

        <div
            className="
                p-4
                border-b
                hover:bg-slate-50
                cursor-pointer
                transition
            "
        >

            <div
                className="
                    flex
                    items-start
                    gap-3
                "
            >

                {

                    !item.isRead && (

                        <div
                            className="
                                w-2
                                h-2
                                rounded-full
                                bg-blue-500
                                mt-2
                                shrink-0
                            "
                        />
                    )
                }

                <div
                    className="
                        flex-1
                    "
                >

                    <p
                        className="
                            text-sm
                            font-semibold
                        "
                    >
                        {item.title}
                    </p>

                    <p
                        className="
                            text-sm
                            text-slate-600
                            mt-1
                        "
                    >
                        {item.message}
                    </p>

                    <p
                        className="
                            text-xs
                            text-slate-400
                            mt-2
                        "
                    >
                        {item.timeLabel}
                    </p>

                </div>

            </div>

        </div>
    )
}