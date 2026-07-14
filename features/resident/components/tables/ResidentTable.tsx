// @ts-nocheck
'use client'

import ResidentRow
    from './ResidentRow'
import { useTranslations } from 'next-intl'

export default function ResidentTable({

                                       data = [],
                                       loading,

                                       onDetail,
                                       onEdit,

                                       refresh

                                   }) {

    const t = useTranslations('residents')
    const tc = useTranslations('common')

    if (loading) {

        return (
            <div data-testid="resident-table-loading">
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

                        <ResidentRow

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