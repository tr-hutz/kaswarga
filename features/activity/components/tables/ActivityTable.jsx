'use client'

import ActivityRow
    from './ActivityRow'

export default function ActivityTable({

                                          rows = [],
                                          onSelect

                                      }) {

    return (

        <div
            className="
                bg-white
                rounded-xl
                border
                overflow-hidden
            "
        >

            <table
                className="
                    w-full
                    text-sm
                "
            >

                <thead
                    className="
                        bg-slate-50
                    "
                >

                <tr>

                    <th className="p-4 text-left">
                        Actor
                    </th>

                    <th className="p-4 text-left">
                        Action
                    </th>

                    <th className="p-4 text-left">
                        Entity
                    </th>

                    <th className="p-4 text-left">
                        Description
                    </th>

                    <th className="p-4 text-left">
                        Time
                    </th>

                </tr>

                </thead>

                <tbody>

                {rows.map(row => (

                    <ActivityRow

                        key={row.id}

                        row={row}

                        onClick={() => onSelect(row)}

                    />

                ))}

                </tbody>

            </table>

        </div>
    )
}