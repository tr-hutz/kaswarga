// @ts-nocheck
'use client'

import RegistrasiCard from './components/RegistrasiCard'

const TABS = [
    { key: 'pending',  label: 'Menunggu'  },
    { key: 'approved', label: 'Disetujui' },
    { key: 'rejected', label: 'Ditolak'   },
    { key: 'all',      label: 'Semua'     },
]

export default function RtRegistrasiView({ requests, loading, filter, setFilter, refresh }) {
    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold">Pendaftaran RT</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Kelola permintaan pendaftaran RT baru
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilter(tab.key)}
                        className={`
                            flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                            ${filter === tab.key
                                ? 'bg-black text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }
                        `}
                    >
                        {tab.label}
                        {filter === tab.key && requests.length > 0 && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                                filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {requests.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">Tidak ada pendaftaran</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <RegistrasiCard key={req.id} req={req} onAction={refresh} />
                    ))}
                </div>
            )}

        </div>
    )
}