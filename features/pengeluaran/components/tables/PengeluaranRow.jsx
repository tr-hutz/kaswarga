'use client'


import {formatRupiah} from "../../../../lib/utils";

export default function PengeluaranRow({

                                           row,
                                           onSelect,
                                           onEdit,
                                           onDelete

                                       }) {

    return (

        <tr
            className="
        border-t
        hover:bg-slate-50
        cursor-pointer
      "
            onClick={() =>
                onSelect(row)
            }
        >

            <td className="p-4">
                {row.tanggal}
            </td>

            <td className="p-4">
                {row.kategori}
            </td>

            <td className="p-4">
                {row.deskripsi}
            </td>

            <td
                className="
          p-4
          text-right
          font-medium
        "
            >
                {formatRupiah(row.nominal || 0)}
            </td>

            <td
                className="
          p-4
        "
            >

                <div
                    className="
            flex
            justify-end
            gap-2
          "
                >

                    <button
                        onClick={e => {

                            e.stopPropagation()

                            onEdit(row)
                        }}
                        className="
              text-sm
              border
              px-3
              py-1
              rounded-lg
            "
                    >
                        Edit
                    </button>

                    <button
                        onClick={e => {

                            e.stopPropagation()

                            onDelete(row)

                        }}

                        className="
              text-sm
              border
              px-3
              py-1
              rounded-lg
              text-red-600
            "
                    >
                        Hapus
                    </button>

                </div>

            </td>

        </tr>
    )
}