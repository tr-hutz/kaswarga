// @ts-nocheck
'use client'

import PageToolbar from "../../../../components/common/toolbar/PageToolbar";
import { useTranslations } from 'next-intl'

export default function PaymentToolbar({

                                          search,
                                          setSearch,

                                          status,
                                          setStatus,

                                          onExportCSV,
                                          onExportExcel

                                      }) {

    const t = useTranslations('payments')
    const tc = useTranslations('common')

    return (

        <PageToolbar

            title={t('title')}

            subtitle={t('subtitle')}

            search={search}
            setSearch={setSearch}

            searchPlaceholder={t('searchPlaceholder')}

            filterValue={status}
            setFilterValue={setStatus}

            filterPlaceholder={t('filterPlaceholder')}

            filterOptions={[
                {
                    label: tc('paymentStatus.pending'),
                    value: 'pending'
                },

                {
                    label: tc('paymentStatus.approved'),
                    value: 'approved'
                },

                {
                    label: tc('paymentStatus.rejected'),
                    value: 'rejected'
                }
            ]}

            onExportCSV={onExportCSV}
            onExportExcel={onExportExcel}

        />

    )
}