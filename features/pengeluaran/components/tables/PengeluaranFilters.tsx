// @ts-nocheck
'use client'

import { useExpenseCategories } from '../../hooks/usePengeluaranKategori'

export default function PengeluaranFilters({

                                               search,
                                               setSearch,

                                               category,
                                               setCategory

                                           }) {

    const { categories } = useExpenseCategories()

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

                value={category}

                onChange={e =>
                    setCategory(
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

                {categories.map(k => (
                    <option key={k.id} value={k.nama}>
                        {k.nama}
                    </option>
                ))}

            </select>

        </div>
    )
}