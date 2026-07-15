// @ts-nocheck
'use client'

import Icon from '@/components/ui/Icon'
import { useTranslations } from 'next-intl'

export default function NotificationToolbar({

                                                search,

                                                setSearch,

                                                filter,

                                                setFilter,

                                                onMarkAllRead,

                                            }) {

    const t = useTranslations('notification')

    return (

        <div
            className="
                flex

                flex-col
                lg:flex-row

                gap-3

                lg:items-center
                lg:justify-between
            "
        >

            <div>

                <h1
                    className="
                        text-2xl
                        font-semibold
                    "
                >
                    {t('title')}
                </h1>

                <p
                    className="
                        text-sm
                        text-gray-500
                    "
                >
                    {t('subtitle')}
                </p>

            </div>

            <div
                className="
                    flex
                    flex-col
                    md:flex-row

                    gap-2
                "
            >

                <div
                    className="
                        relative
                    "
                >

                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                    <input

                        value={search}

                        onChange={
                            e =>
                                setSearch(
                                    e.target.value
                                )
                        }

                        placeholder={t('searchPlaceholder')}

                        className="
                            h-10

                            pl-9
                            pr-3

                            border
                            rounded-lg
                        "
                    />

                </div>

                <select

                    value={filter}

                    onChange={
                        e =>
                            setFilter(
                                e.target.value
                            )
                    }

                    className="
                        h-10

                        border
                        rounded-lg

                        px-3
                    "
                >

                    <option
                        value="all"
                    >
                        {t('filter.all')}
                    </option>

                    <option
                        value="unread"
                    >
                        {t('filter.unread')}
                    </option>

                </select>

                <button

                    onClick={
                        onMarkAllRead
                    }

                    className="
                        px-3
                        py-2

                        text-sm

                        rounded-lg

                        border

                        hover:bg-gray-50
                    "
                >

                    {t('markAllRead')}

                </button>

            </div>

        </div>

    )
}