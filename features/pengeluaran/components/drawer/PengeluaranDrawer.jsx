'use client'

import { formatRupiah } from '../../../../lib/utils'
import PengeluaranStatusBadge   from '../tables/PengeluaranStatusBadge'
import PengeluaranApprovalBar   from '../approval/PengeluaranApprovalBar'

export default function PengeluaranDrawer({
    open,
    onClose,
    row,
    role,
    onApprove,
    onReject,
    approvalLoading,
}) {

    if (!open || !row) return null

    const approvedAtLabel = row.approvedAt
        ? new Date(row.approvedAt).toLocaleString('id-ID')
        : null

    return (
        <div
            className="fixed inset-0 bg-black/20 z-50 flex justify-end"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">Detail Pengeluaran</h2>
                        {row.receiptNumber && (
                            <p className="font-mono text-sm text-gray-500 mt-0.5">{row.receiptNumber}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <PengeluaranStatusBadge status={row.status} />
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">

                    <Field label="Tanggal"        value={row.dateLabel || row.date} />
                    <Field label="Kategori"       value={row.category || '—'} />
                    <Field label="Nominal"        value={`Rp ${formatRupiah(row.amount)}`} />

                    {row.recipient && (
                        <Field label="Mitra / Penerima" value={row.recipient} />
                    )}

                    {row.description && (
                        <Field label="Deskripsi" value={row.description} />
                    )}

                </div>

                {/* Approval / Rejection info */}
                {row.status === 'approved' && approvedAtLabel && (
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800">
                        Disetujui pada {approvedAtLabel}
                    </div>
                )}

                {row.status === 'rejected' && (
                    <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800 space-y-1">
                        <p className="font-medium">Ditolak</p>
                        {row.rejectionNote && (
                            <p className="text-red-700">{row.rejectionNote}</p>
                        )}
                    </div>
                )}

                {/* Nota */}
                {row.receiptUrl && (
                    <div className="mt-6">
                        <p className="text-sm text-slate-500 mb-2">Nota</p>
                        {row.receiptUrl.endsWith('.pdf') ? (
                            <a
                                href={row.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 text-sm underline"
                            >
                                Buka Nota (PDF)
                            </a>
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={row.receiptUrl}
                                alt="Nota"
                                className="rounded-xl border w-full object-contain"
                            />
                        )}
                    </div>
                )}

                {/* Approval bar — ketua only, pending only */}
                {role === 'ketua' && (
                    <div className="mt-6">
                        <PengeluaranApprovalBar
                            row={row}
                            onApprove={onApprove}
                            onReject={onReject}
                            loading={approvalLoading}
                        />
                    </div>
                )}

            </div>
        </div>
    )
}

function Field({ label, value }) {
    return (
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    )
}