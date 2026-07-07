// @ts-nocheck
'use client'

import PengeluaranRow from './PengeluaranRow'

export default function PengeluaranTable({
    rows = [],
    loading,
    role,
    onSelect,
    onEdit,
    onDelete,
}) {

    if (loading) {
        return <div className="p-6 text-sm text-gray-400">Memuat data...</div>
    }

    return (
        <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-4 text-left">Nomor Bukti</th>
                        <th className="p-4 text-left">Tanggal</th>
                        <th className="p-4 text-left">Kategori</th>
                        <th className="p-4 text-left">Mitra / Penerima</th>
                        <th className="p-4 text-right">Nominal</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-sm text-gray-400">
                                Belum ada data pengeluaran.
                            </td>
                        </tr>
                    ) : (
                        rows.map(row => (
                            <PengeluaranRow
                                key={row.id}
                                row={row}
                                role={role}
                                onSelect={onSelect}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}