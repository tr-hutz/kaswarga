// @ts-nocheck
'use client'

import {
    deleteResident
} from '@/lib/services/warga.service'

export default function WargaRow({

                                     item,

                                     onDetail,
                                     onEdit,

                                     refresh

                                 }) {

    async function handleDelete() {

        const ok =
            confirm(
                'Nonaktifkan warga ini?'
            )

        if (!ok) {
            return
        }

        try {

            await deleteResident(
                item.id
            )

            refresh()

        } catch (err) {

            console.error(err)

            alert(
                'Gagal menghapus warga'
            )
        }
    }

    return (

        <tr
            className="
        border-t
      "
        >

            <td
                className="
          p-4
          font-medium
          cursor-pointer
        "
                onClick={() =>
                    onDetail(item)
                }
            >
                {item.name}
            </td>

            <td className="p-4">
                {item.block}
            </td>

            <td className="p-4">
                {item.houseNumber}
            </td>

            <td className="p-4">
                {item.phone || '-'}
            </td>

            <td className="p-4">

                {
                    item.active
                        ? 'Aktif'
                        : 'Nonaktif'
                }

            </td>

            <td
                className="
          p-4
          text-right
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
                        onClick={() =>
                            onEdit(item)
                        }
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
                        onClick={handleDelete}
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