'use client'

import { Upload, Download, X, AlertCircle, CheckCircle } from 'lucide-react'

export default function WargaImportModal({
    open,
    onClose,
    rows,
    fileName,
    fileRef,
    importing,
    error,
    onFile,
    onImport,
    onDownloadTemplate,
    onReset,
}) {

    if (!open) return null

    const validRows   = rows.filter(r => r.nama?.trim())
    const invalidRows = rows.filter(r => !r.nama?.trim())
    const hasFile     = rows.length > 0

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-base font-semibold">Import Data Warga</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Format yang didukung: CSV atau Excel (.xlsx)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {!hasFile ? (
                        <div className="space-y-4">

                            {/* Template download */}
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                <span className="text-sm text-gray-600">
                                    Gunakan template agar format kolom sesuai.
                                </span>
                                <button
                                    type="button"
                                    onClick={onDownloadTemplate}
                                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline whitespace-nowrap shrink-0"
                                >
                                    <Download size={14} />
                                    Unduh Template
                                </button>
                            </div>

                            {/* Drop zone */}
                            <label className="
                                block border-2 border-dashed border-gray-200 rounded-2xl
                                p-12 text-center cursor-pointer
                                hover:border-blue-400 hover:bg-blue-50 transition-colors
                            ">
                                <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-700">
                                    Klik untuk memilih file
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    CSV atau Excel (.xlsx / .xls)
                                </p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={e => onFile(e.target.files?.[0])}
                                />
                            </label>

                            {/* Column guide */}
                            <div className="text-xs text-gray-400 space-y-1">
                                <p className="font-medium text-gray-500">Kolom yang dikenali:</p>
                                <p>
                                    <span className="font-mono bg-gray-100 px-1 rounded">nama</span> (wajib) &nbsp;·&nbsp;
                                    <span className="font-mono bg-gray-100 px-1 rounded">blok</span> &nbsp;·&nbsp;
                                    <span className="font-mono bg-gray-100 px-1 rounded">no_rumah</span> &nbsp;·&nbsp;
                                    <span className="font-mono bg-gray-100 px-1 rounded">no_hp</span>
                                </p>
                            </div>

                        </div>
                    ) : (
                        <div className="space-y-3">

                            {/* File info bar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-gray-700 truncate max-w-xs">
                                        {fileName}
                                    </span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-emerald-600 font-medium">
                                        {validRows.length} valid
                                    </span>
                                    {invalidRows.length > 0 && (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-red-500">
                                                {invalidRows.length} dilewati
                                            </span>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="text-xs text-gray-400 hover:text-gray-600 underline shrink-0"
                                >
                                    Ganti file
                                </button>
                            </div>

                            {/* Preview table */}
                            <div className="rounded-xl border overflow-hidden">
                                <div className="overflow-auto max-h-72">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left w-8 font-medium">#</th>
                                                <th className="px-3 py-2 text-left font-medium">Nama</th>
                                                <th className="px-3 py-2 text-left font-medium">Blok</th>
                                                <th className="px-3 py-2 text-left font-medium">No. Rumah</th>
                                                <th className="px-3 py-2 text-left font-medium">No HP</th>
                                                <th className="px-3 py-2 text-center font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rows.map((row, i) => {
                                                const valid = !!row.nama?.trim()
                                                return (
                                                    <tr
                                                        key={i}
                                                        className={valid ? 'hover:bg-gray-50' : 'bg-red-50'}
                                                    >
                                                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                        <td className="px-3 py-2 font-medium text-gray-800">
                                                            {row.nama?.trim() || (
                                                                <span className="text-red-400 italic">kosong</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500">{row.blok     || '-'}</td>
                                                        <td className="px-3 py-2 text-gray-500">{row.no_rumah || '-'}</td>
                                                        <td className="px-3 py-2 text-gray-500">{row.no_hp    || '-'}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            {valid
                                                                ? <CheckCircle size={14} className="inline text-emerald-500" />
                                                                : <AlertCircle size={14} className="inline text-red-400" />
                                                            }
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {invalidRows.length > 0 && (
                                <p className="text-xs text-red-500">
                                    Baris dengan nama kosong tidak akan diimpor.
                                </p>
                            )}

                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border rounded-xl px-4 py-2 text-sm"
                    >
                        Batal
                    </button>
                    {hasFile && (
                        <button
                            type="button"
                            onClick={onImport}
                            disabled={importing || validRows.length === 0}
                            className="bg-black text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {importing
                                ? 'Mengimpor...'
                                : `Import ${validRows.length} Warga`
                            }
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}