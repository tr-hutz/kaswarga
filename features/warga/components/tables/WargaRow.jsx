'use client'

import {
    deleteWarga
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

            await deleteWarga(
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
                {item.nama}
            </td>

            <td className="p-4">
                {item.blok}
            </td>

            <td className="p-4">
                {item.noRumah}
            </td>

            <td className="p-4">
                {item.noHp || '-'}
            </td>

            <td className="p-4">

                {
                    item.aktif
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