// @ts-nocheck
'use client'

export default function PaymentHistoryRow({

                                              row

                                          }) {

    return (

        <tr
            className="
        border-b
        hover:bg-slate-50
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

            <td className="p-4 text-slate-500">
                {
                    new Date(row.date)
                        .toLocaleDateString('id-ID')
                }
            </td>

        </tr>
    )
}