'use client'

import { useTranslations } from 'next-intl'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResidentDetailSummary({ resident }: { resident: any }) {

    const t = useTranslations('residents')

    if (!resident) {
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
                    {resident.name}
                </h2>

                <p
                    className="
                        text-sm
                        text-slate-500
                    "
                >
                    {t('detail.blockLabel')} {resident.block} / {resident.houseNumber}
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
                        {resident.phone}
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
                        {resident.status}
                    </p>

                </div>

            </div>

        </div>
    )
}