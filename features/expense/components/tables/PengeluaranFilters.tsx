// @ts-nocheck
'use client'

import { useExpenseCategories } from '../../hooks/usePengeluaranKategori'
import { useTranslations } from 'next-intl'

export default function PengeluaranFilters({

                                               search,
                                               setSearch,

                                               category,
                                               setCategory

                                           }) {

    const t = useTranslations('pengeluaran')
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

                placeholder={t('searchPlaceholder')}

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
                    {t('filterPlaceholder')}
                </option>

                {categories.map(k => (
                    <option key={k.id} value={k.name}>
                        {k.name}
                    </option>
                ))}

            </select>

        </div>
    )
}