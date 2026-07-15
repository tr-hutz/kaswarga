// @ts-nocheck
'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

export default function LedgerToolbar({

                                          search,
                                          setSearch,

                                          onExportCSV,
                                          onExportExcel

                                      }) {

    const t = useTranslations('ledger')

    return (

        <div
            className="
                bg-white
                rounded-2xl
                border
                p-4
                flex
                flex-col
                md:flex-row
                gap-4
                md:items-center
                md:justify-between
            "
        >

            <div
                className="
                    relative
                    w-full
                    md:max-w-sm
                "
            >

                <Icon name="search"
                    className="
                        w-4
                        h-4
                        absolute
                        left-3
                        top-3
                        text-slate-400
                    "
                />

                <input

                    value={search}

                    onChange={e =>
                        setSearch(
                            e.target.value
                        )
                    }

                    placeholder={t('searchPlaceholder')}

                    className="
                        w-full
                        border
                        rounded-xl
                        pl-10
                        pr-4
                        py-2
                    "
                />

            </div>

            <div
                className="
                    flex
                    gap-2
                "
            >

                <button

                    onClick={
                        onExportCSV
                    }

                    className="
                        border
                        rounded-xl
                        px-4
                        py-2
                        flex
                        items-center
                        gap-2
                    "
                >

                    <Icon name="download"
                        className="
                            w-4
                            h-4
                        "
                    />

                    CSV

                </button>

                <button

                    onClick={
                        onExportExcel
                    }

                    className="
                        bg-slate-900
                        text-white
                        rounded-xl
                        px-4
                        py-2
                        flex
                        items-center
                        gap-2
                    "
                >

                    <Icon name="download"
                        className="
                            w-4
                            h-4
                        "
                    />

                    Excel

                </button>

            </div>

        </div>
    )
}