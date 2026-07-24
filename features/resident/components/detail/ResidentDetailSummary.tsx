'use client'

import { useTranslations } from 'next-intl'
import ResidentStatusBadge from '../tables/ResidentStatusBadge'

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
                        text-muted
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
                            text-muted
                        "
                    >
                        {t('table.phone')}
                    </p>

                    <p
                        className="
                            font-medium
                        "
                    >
                        {resident.phone || '-'}
                    </p>

                </div>

                <div>

                    <p
                        className="
                            text-xs
                            text-muted
                        "
                    >
                        {t('table.status')}
                    </p>

                    <div className="mt-1">
                        <ResidentStatusBadge
                            status={resident.active ? 'active' : 'inactive'}
                        />
                    </div>

                </div>

            </div>

        </div>
    )
}