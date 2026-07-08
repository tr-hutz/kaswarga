// @ts-nocheck
'use client'

import ExportButtons
    from '../../../pembayaran/components/exports/ExportButtons'

import { useTranslations } from 'next-intl'

export default function WargaActionBar({

                                           rows,

                                           onCreate

                                       }) {

    const t = useTranslations('warga')

    return (

        <div
            className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
            "
        >

            <div>

                <h1
                    className="
                        text-2xl
                        font-bold
                    "
                >
                    {t('title')}
                </h1>

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    {t('clusterSubtitle')}
                </p>

            </div>

            <div
                className="
                    flex
                    items-center
                    gap-3
                "
            >

                <button
                    onClick={onCreate}
                    className="
                        px-4
                        py-2
                        rounded-xl
                        bg-slate-900
                        text-white
                        text-sm
                        font-medium
                    "
                >
                    {t('form.addTitle')}
                </button>

                <ExportButtons
                    rows={rows}
                />

            </div>

        </div>
    )
}