// @ts-nocheck
'use client'

export default function ActivityRow({

                                        row,
                                        onClick

                                    }) {

    return (

        <tr
            onClick={onClick}

            className="
                border-t
                hover:bg-slate-50
                cursor-pointer
            "
        >

            <td className="p-4">
                {row.actorName}
            </td>

            <td className="p-4">
                {row.action}
            </td>

            <td className="p-4">
                {row.entityType}
            </td>

            <td className="p-4">
                {row.description}
            </td>

            <td className="p-4">
                {

                    new Date(
                        row.createdAt
                    ).toLocaleString()

                }
            </td>

        </tr>
    )
}