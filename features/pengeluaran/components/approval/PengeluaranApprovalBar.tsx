// @ts-nocheck
'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { isPending } from '../../services/pengeluaran-status'

export default function PengeluaranApprovalBar({ row, onApprove, onReject, loading }) {

    const [rejectMode, setRejectMode] = useState(false)
    const [alasan,     setAlasan]     = useState('')

    if (!row || !isPending(row.status)) return null

    if (rejectMode) {
        return (
            <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700">Alasan penolakan</p>
                <textarea
                    value={alasan}
                    onChange={e => setAlasan(e.target.value)}
                    placeholder="Tuliskan alasan penolakan (opsional)..."
                    rows={3}
                    className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setRejectMode(false)}
                        className="flex-1 border rounded-xl px-4 py-2 text-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => onReject(row.id, alasan)}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Konfirmasi Tolak
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-3 pt-4 border-t">
            <button
                type="button"
                onClick={() => onApprove(row.id)}
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white rounded-xl px-4 py-3 font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Setujui
            </button>
            <button
                type="button"
                onClick={() => setRejectMode(true)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white rounded-xl px-4 py-3 font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
                Tolak
            </button>
        </div>
    )
}