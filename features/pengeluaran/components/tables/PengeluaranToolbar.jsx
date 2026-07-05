'use client'

import PageToolbar from '../../../../components/toolbar/PageToolbar'
import { usePengeluaranKategori } from '../../hooks/usePengeluaranKategori'

export default function PengeluaranToolbar({
    search,
    setSearch,

    kategori,
    setKategori,

    role,
    pendingCount,
    onApproveAll,

    onCreate,
    onExportCSV,
    onExportExcel,
    onImport,
}) {

    const { kategori: kategoriList } = usePengeluaranKategori()

    const filterOptions = kategoriList.map(k => ({
        label: k.nama,
        value: k.nama,
    }))

    return (
        <div className="w-full space-y-3">
            <PageToolbar
                title="Pengeluaran"
                subtitle="Manajemen pengeluaran RT"

                onCreate={role === 'bendahara' ? onCreate : undefined}

                search={search}
                setSearch={setSearch}
                searchPlaceholder="Cari pengeluaran..."

                filterValue={kategori}
                setFilterValue={setKategori}
                filterPlaceholder="Semua Kategori"
                filterOptions={filterOptions}

                onExportCSV={onExportCSV}
                onExportExcel={onExportExcel}

                onImport={role === 'bendahara' ? onImport : undefined}
            />

            {role === 'ketua' && pendingCount > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={onApproveAll}
                        className="bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition"
                    >
                        Setujui Semua ({pendingCount})
                    </button>
                </div>
            )}
        </div>
    )
}