// @ts-nocheck
'use client'

import PageToolbar from "../../../../components/toolbar/PageToolbar";
import { useTranslations } from 'next-intl'

export default function ResidentToolbar({

                                         onAdd,

                                         search,
                                         setSearch,

                                         status,
                                         setStatus,

                                         onExportCSV,
                                         onExportExcel,

                                         onImport

                                     }) {

    const t = useTranslations('warga')
    const tc = useTranslations('common')

    return (

        <PageToolbar

            title={t('title')}

            subtitle={t('subtitle')}

            onCreate={onAdd}

            search={search}
            setSearch={setSearch}

            searchPlaceholder={t('searchPlaceholder')}

            filterValue={status}
            setFilterValue={setStatus}

            filterPlaceholder={t('filterPlaceholder')}

            filterOptions={[

                {
                    label: tc('status.active'),
                    value: 'active'
                },

                {
                    label: tc('status.inactive'),
                    value: 'inactive'
                }
            ]}

            onExportCSV={onExportCSV}
            onExportExcel={onExportExcel}

            onImport={onImport}

        />

    )
}