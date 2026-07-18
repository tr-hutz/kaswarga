'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PaymentHistoryRow({ row }: { row: any }) {

    return (

        <tr
            className="
        border-b
        hover:bg-canvas
      "
        >

            <td className="p-4">
                {row.monthLabel}
            </td>

            <td className="p-4">
                {row.year}
            </td>

            <td className="p-4 font-medium">
                Rp {(row.amount || 0).toLocaleString('id-ID')}
            </td>

            <td className="p-4 text-muted">
                {
                    new Date(row.date)
                        .toLocaleDateString('id-ID')
                }
            </td>

        </tr>
    )
}