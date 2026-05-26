'use client'

export default function PengeluaranToolbar({

                                               search,
                                               setSearch,

                                               kategori,
                                               setKategori,

                                               onCreate,

                                               onExportCSV,
                                               onExportExcel

                                           }) {

    return (

        <div
            className="
        flex
        items-center
        justify-between
        gap-3
        flex-wrap
      "
        >

            <div>

                <h1
                    className="
            text-2xl
            font-bold
          "
                >
                    Pengeluaran
                </h1>

                <p
                    className="
            text-sm
            text-slate-500
          "
                >
                    Manajemen pengeluaran kas
                </p>

            </div>

            <div
                className="
          flex
          items-center
          gap-3
          flex-wrap
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
            Cari pengeluaran
          "

                    className="
            border
            rounded-xl
            px-4
            py-2
            text-sm
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

                <button

                    onClick={onCreate}

                    className="
            px-4
            py-2
            rounded-xl
            bg-black
            text-white
            text-sm
          "
                >

                    Tambah Pengeluaran

                </button>

            </div>

        </div>
    )
}