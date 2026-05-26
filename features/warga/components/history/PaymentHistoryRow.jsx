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
                {row.bulanLabel}
            </td>

            <td className="p-4">
                {row.tahun}
            </td>

            <td className="p-4 font-medium">
                Rp {row.nominal.toLocaleString('id-ID')}
            </td>

            <td className="p-4 text-slate-500">
                {
                    new Date(row.tanggal)
                        .toLocaleDateString('id-ID')
                }
            </td>

        </tr>
    )
}