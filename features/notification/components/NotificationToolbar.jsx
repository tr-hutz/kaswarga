'use client'

import {
    Search
} from 'lucide-react'

export default function NotificationToolbar({

                                                search,

                                                setSearch,

                                                filter,

                                                setFilter,

                                                onMarkAllRead,

                                            }) {

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
                    Notifikasi
                </h1>

                <p
                    className="
                        text-sm
                        text-gray-500
                    "
                >
                    Riwayat notifikasi sistem
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

                    <Search
                        size={16}
                        className="
                            absolute

                            left-3
                            top-1/2

                            -translate-y-1/2

                            text-gray-400
                        "
                    />

                    <input

                        value={search}

                        onChange={
                            e =>
                                setSearch(
                                    e.target.value
                                )
                        }

                        placeholder="
                            Cari notifikasi...
                        "

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
                        Semua
                    </option>

                    <option
                        value="unread"
                    >
                        Belum Dibaca
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

                    Tandai Semua Dibaca

                </button>

            </div>

        </div>

    )
}