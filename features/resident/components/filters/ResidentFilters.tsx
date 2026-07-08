// @ts-nocheck
'use client'

import { useTranslations } from 'next-intl'

export default function ResidentFilters({

                                         search,
                                         setSearch,

                                         status,
                                         setStatus

                                     }) {

    const t = useTranslations('residents')
    const tc = useTranslations('common')

    return (

        <div
            className="
                flex
                flex-col
                md:flex-row
                gap-3
            "
        >

            <input
                type="text"
                value={search}
                onChange={e =>
                    setSearch(
                        e.target.value
                    )
                }
                placeholder="
                    Cari nama / blok / rumah
                "
                className="
                    w-full
                    md:w-80
                    rounded-xl
                    border
                    px-4
                    py-2
                    text-sm
                "
            />

            <select
                value={status}
                onChange={e =>
                    setStatus(
                        e.target.value
                    )
                }
                className="
                    rounded-xl
                    border
                    px-4
                    py-2
                    text-sm
                "
            >

                <option value="">
                    {t('filterPlaceholder')}
                </option>

                <option value="active">
                    {tc('status.active')}
                </option>

                <option value="inactive">
                    {tc('status.inactive')}
                </option>

            </select>

        </div>
    )
}