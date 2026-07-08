// @ts-nocheck
'use client'

import PageToolbar from '../../../../components/toolbar/PageToolbar'
import { useExpenseCategories } from '../../hooks/useExpenseCategory'
import { useTranslations } from 'next-intl'

export default function ExpenseToolbar({
    search,
    setSearch,

    category,
    setCategory,

    role,
    pendingCount,
    onApproveAll,

    onCreate,
    onExportCSV,
    onExportExcel,
    onImport,
}) {

    const t = useTranslations('pengeluaran')
    const { categories } = useExpenseCategories()

    const filterOptions = categories.map(k => ({
        label: k.name,
        value: k.name,
    }))

    return (
        <div className="w-full space-y-3">
            <PageToolbar
                title={t('title')}
                subtitle={t('subtitle')}

                onCreate={role === 'TREASURER' ? onCreate : undefined}

                search={search}
                setSearch={setSearch}
                searchPlaceholder={t('searchPlaceholder')}

                filterValue={category}
                setFilterValue={setCategory}
                filterPlaceholder={t('filterPlaceholder')}
                filterOptions={filterOptions}

                onExportCSV={onExportCSV}
                onExportExcel={onExportExcel}

                onImport={role === 'TREASURER' ? onImport : undefined}
            />

            {role === 'CHAIR' && pendingCount > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={onApproveAll}
                        className="bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition"
                    >
                        {t('approveAll', { count: pendingCount })}
                    </button>
                </div>
            )}
        </div>
    )
}