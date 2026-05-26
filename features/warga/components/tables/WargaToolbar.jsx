'use client'

export default function WargaToolbar({

                                         onAdd,

                                         search,
                                         setSearch,

                                         status,
                                         setStatus

                                     }) {

    return (

        <div
            className="
        flex
        items-center
        justify-between
        gap-4
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
                    Warga
                </h1>

                <p
                    className="
            text-sm
            text-slate-500
          "
                >
                    Manajemen data warga
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
            Cari nama warga
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

                    value={status}

                    onChange={e =>
                        setStatus(
                            e.target.value
                        )
                    }

                    className="
            border
            rounded-xl
            px-4
            py-2
            text-sm
          "
                >

                    <option value="aktif">
                        Aktif
                    </option>

                    <option value="nonaktif">
                        Nonaktif
                    </option>

                    <option value="all">
                        Semua
                    </option>

                </select>

                <button

                    onClick={onAdd}

                    className="
            px-4
            py-2
            rounded-xl
            bg-black
            text-white
            text-sm
          "
                >

                    Tambah Warga

                </button>

            </div>

        </div>
    )
}