// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'
import {
    deleteResident
} from '@/lib/services/resident.service'

export default function ResidentRow({

                                     item,

                                     onDetail,
                                     onEdit,

                                     refresh

                                 }) {

    const t  = useTranslations('residents')
    const tc = useTranslations('common')

    async function handleDelete() {

        const ok = confirm(t('row.deactivateConfirm'))

        if (!ok) {
            return
        }

        try {

            await deleteResident(item.id)

            refresh()

        } catch (err) {

            console.error(err)

            alert(t('row.deleteFailed'))
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
                        ? tc('status.active')
                        : tc('status.inactive')
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
                        {tc('actions.edit')}
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
                        {tc('actions.delete')}
                    </button>

                </div>

            </td>

        </tr>
    )
}