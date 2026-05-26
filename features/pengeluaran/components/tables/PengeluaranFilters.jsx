'use client'

export default function PengeluaranFilters({

                                               search,
                                               setSearch,

                                               kategori,
                                               setKategori

                                           }) {

    return (

        <div
            className="
        flex
        flex-wrap
        gap-3
      "
        >

            <input

                value={search}

                onChange={e =>
                    setSearch(
                        e.target.value
                    )
                }

                placeholder="
          Cari pengeluaran...
        "

                className="
          border
          rounded-xl
          px-4
          py-2
          w-full
          md:w-[300px]
        "
            />

            <select

                value={kategori}

                onChange={e =>
                    setKategori(
                        e.target.value
                    )
                }

                className="
          border
          rounded-xl
          px-4
          py-2
        "
            >

                <option value="all">
                    Semua Kategori
                </option>

                <option value="Operasional">
                    Operasional
                </option>

                <option value="Keamanan">
                    Keamanan
                </option>

                <option value="Kebersihan">
                    Kebersihan
                </option>

                <option value="Perawatan">
                    Perawatan
                </option>

            </select>

        </div>
    )
}