// @ts-nocheck
'use client'

import { AlertTriangle } from 'lucide-react'

export default function RtDeleteConfirm({ rt, onConfirm, onCancel, loading }) {

    if (!rt) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-xl">
                        <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <h2 className="text-base font-semibold">Hapus RT</h2>
                </div>

                <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus <span className="font-medium">{rt.nama}</span>?
                    Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onCancel}
                        className="border rounded-xl px-4 py-2 text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-red-600 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {loading ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>

            </div>
        </div>
    )
}
