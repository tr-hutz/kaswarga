'use client'

import { Pencil, Trash2 } from 'lucide-react'

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    ketua:       'Ketua',
    admin:       'Admin',
    bendahara:   'Bendahara',
    warga:       'Warga'
}

const ROLE_COLORS = {
    super_admin: 'bg-purple-50 text-purple-700',
    ketua:       'bg-blue-50 text-blue-700',
    admin:       'bg-indigo-50 text-indigo-700',
    bendahara:   'bg-amber-50 text-amber-700',
    warga:       'bg-gray-100 text-gray-600'
}

export default function UserTable({ data, loading, onEditRole, onRemoveMembership }) {

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                Memuat data pengguna...
            </div>
        )
    }

    if (!data?.length) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                Belum ada data pengguna.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-4 py-3 text-left">Nama</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">RT</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map(user => {

                        const memberships = user.memberships || []

                        if (!memberships.length) {
                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.nama || '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-400 italic">Tanpa RT</td>
                                    <td className="px-4 py-3 text-gray-400 italic">-</td>
                                    <td className="px-4 py-3 text-center text-gray-400">-</td>
                                </tr>
                            )
                        }

                        return memberships.map((m, idx) => (
                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                {idx === 0 && (
                                    <>
                                        <td className="px-4 py-3 font-medium" rowSpan={memberships.length}>
                                            {user.nama || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500" rowSpan={memberships.length}>
                                            {user.email}
                                        </td>
                                    </>
                                )}
                                <td className="px-4 py-3 text-gray-600">
                                    {m.rt?.nama || <span className="italic text-gray-400">System</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`
                                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {ROLE_LABELS[m.role] || m.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onEditRole({ user, membership: m })}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                                            title="Ubah Role"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => onRemoveMembership(m)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                            title="Hapus Membership"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    })}
                </tbody>
            </table>
        </div>
    )
}
