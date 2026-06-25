'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

export default function RtTable({ data, loading, onEdit, onDelete }) {

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                Memuat data RT...
            </div>
        )
    }

    if (!data?.length) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                Belum ada data RT.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-4 py-3 text-left">Nama RT</th>
                        <th className="px-4 py-3 text-left">Kode</th>
                        <th className="px-4 py-3 text-left">Kota</th>
                        <th className="px-4 py-3 text-right">Iuran / Bulan</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map(rt => (
                        <tr key={rt.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium">{rt.nama}</td>
                            <td className="px-4 py-3 text-gray-500">{rt.kode || '-'}</td>
                            <td className="px-4 py-3 text-gray-500">{rt.kota || '-'}</td>
                            <td className="px-4 py-3 text-right">{formatRupiah(rt.nominal_iuran)}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`
                                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                    ${rt.aktif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}
                                `}>
                                    {rt.aktif ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onEdit(rt)}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(rt)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
