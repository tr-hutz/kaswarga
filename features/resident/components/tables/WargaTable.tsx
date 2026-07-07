// @ts-nocheck
'use client'

import WargaRow
    from './WargaRow'
import { useTranslations } from 'next-intl'

export default function WargaTable({

                                       data = [],
                                       loading,

                                       onDetail,
                                       onEdit,

                                       refresh

                                   }) {

    const t = useTranslations('warga')
    const tc = useTranslations('common')

    if (loading) {

        return (
            <div>
                {tc('states.loading')}
            </div>
        )
    }

    return (

        <div
            className="
        bg-white
        rounded-2xl
        border
        overflow-hidden
      "
        >

            <table
                className="
          w-full
        "
            >

                <thead
                    className="
            bg-slate-50
          "
                >

                <tr>

                    <th className="p-4 text-left">
                        {t('table.name')}
                    </th>

                    <th className="p-4 text-left">
                        {t('table.block')}
                    </th>

                    <th className="p-4 text-left">
                        {t('table.houseNumber')}
                    </th>

                    <th className="p-4 text-left">
                        {t('table.phone')}
                    </th>

                    <th className="p-4 text-left">
                        {t('table.status')}
                    </th>

                    <th className="p-4 text-right">
                        {t('table.actions')}
                    </th>

                </tr>

                </thead>

                <tbody>

                {
                    data.map(item => (

                        <WargaRow

                            key={item.id}

                            item={item}

                            onDetail={onDetail}

                            onEdit={onEdit}

                            refresh={refresh}

                        />

                    ))
                }

                </tbody>

            </table>

        </div>
    )
}