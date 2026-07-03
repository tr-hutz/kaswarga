'use client'

import { formatRupiah }          from '../../../../lib/utils'
import PengeluaranStatusBadge    from './PengeluaranStatusBadge'

export default function PengeluaranRow({
    row,
    role,
    onSelect,
    onEdit,
    onDelete,
}) {

    const canEdit = role === 'bendahara' && row.status === 'pending'

    return (
        <tr
            className="border-t hover:bg-slate-50 cursor-pointer"
            onClick={() => onSelect(row)}
        >
            <td className="p-4 font-mono text-xs text-gray-500">
                {row.nomorBukti || '—'}
            </td>

            <td className="p-4">
                {row.tanggalLabel || row.tanggal}
            </td>

            <td className="p-4">
                {row.kategori || '—'}
            </td>

            <td className="p-4 text-gray-600">
                {row.penerima || '—'}
            </td>

            <td className="p-4 text-right font-medium">
                {formatRupiah(row.nominal || 0)}
            </td>

            <td className="p-4 text-center">
                <PengeluaranStatusBadge status={row.status} />
            </td>

            <td className="p-4">
                {canEdit && (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); onEdit(row) }}
                            className="text-sm border px-3 py-1 rounded-lg"
                        >
                            Edit
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onDelete(row) }}
                            className="text-sm border px-3 py-1 rounded-lg text-red-600"
                        >
                            Hapus
                        </button>
                    </div>
                )}
            </td>
        </tr>
    )
}