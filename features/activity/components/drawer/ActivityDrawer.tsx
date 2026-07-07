// @ts-nocheck
'use client'

export default function ActivityDrawer({

                                           open,
                                           row,
                                           onClose

                                       }) {

    if (!open || !row) {
        return null
    }

    return (

        <div

            className="
                fixed
                inset-0
                bg-black/20
                z-50
                flex
                justify-end
            "

            onClick={onClose}
        >

            <div
                className="
                    w-full
                    max-w-lg
                    bg-white
                    h-full
                    overflow-y-auto
                    p-6
                    shadow-2xl
                "

                onClick={e =>
                    e.stopPropagation()
                }
            >

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        mb-6
                    "
                >

                    <h2
                        className="
                            text-xl
                            font-semibold
                        "
                    >
                        Activity Detail
                    </h2>

                    <button
                        onClick={onClose}
                    >
                        Close
                    </button>

                </div>

                <div
                    className="
                        space-y-4
                        text-sm
                    "
                >

                    <div>

                        <p className="text-slate-500">
                            Actor
                        </p>

                        <p className="font-medium">
                            {row.actorName}
                        </p>

                    </div>

                    <div>

                        <p className="text-slate-500">
                            Action
                        </p>

                        <p className="font-medium">
                            {row.action}
                        </p>

                    </div>

                    <div>

                        <p className="text-slate-500">
                            Entity
                        </p>

                        <p className="font-medium">
                            {row.entityType}
                        </p>

                    </div>

                    <div>

                        <p className="text-slate-500">
                            Description
                        </p>

                        <p>
                            {row.description}
                        </p>

                    </div>

                    <div>

                        <p className="text-slate-500">
                            Metadata
                        </p>

                        <pre
                            className="
                                bg-slate-100
                                p-4
                                rounded-lg
                                overflow-auto
                                text-xs
                            "
                        >

                            {

                                JSON.stringify(

                                    row.metadata,

                                    null,

                                    2

                                )

                            }

                        </pre>

                    </div>

                </div>

            </div>

        </div>
    )
}