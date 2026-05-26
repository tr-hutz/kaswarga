'use client'

export default function WargaFilters({

                                         search,
                                         setSearch,

                                         status,
                                         setStatus

                                     }) {

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
                    Semua Status
                </option>

                <option value="active">
                    Aktif
                </option>

                <option value="inactive">
                    Nonaktif
                </option>

            </select>

        </div>
    )
}