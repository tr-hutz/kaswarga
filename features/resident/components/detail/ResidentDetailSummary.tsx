// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function ResidentDetailSummary({

                                               warga

                                           }) {

    const t = useTranslations('residents')

    if (!warga) {
        return null
    }

    return (

        <div
            className="
                space-y-4
            "
        >

            <div>

                <h2
                    className="
                        text-xl
                        font-bold
                    "
                >
                    {warga.name}
                </h2>

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    Blok {warga.block} / {warga.houseNumber}
                </p>

            </div>

            <div
                className="
                    grid
                    grid-cols-2
                    gap-4
                "
            >

                <div>

                    <p
                        className="
                            text-xs
                            text-slate-500
                        "
                    >
                        {t('table.phone')}
                    </p>

                    <p
                        className="
                            font-medium
                        "
                    >
                        {warga.phone}
                    </p>

                </div>

                <div>

                    <p
                        className="
                            text-xs
                            text-slate-500
                        "
                    >
                        {t('table.status')}
                    </p>

                    <p
                        className="
                            font-medium
                        "
                    >
                        {warga.status}
                    </p>

                </div>

            </div>

        </div>
    )
}