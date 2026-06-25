'use client'

import { useState } from 'react'

const ROLES = [
    { value: 'ketua',     label: 'Ketua' },
    { value: 'admin',     label: 'Admin' },
    { value: 'bendahara', label: 'Bendahara' },
    { value: 'warga',     label: 'Warga' }
]

export default function EditRoleForm({ target, onSave, onClose, saving }) {

    const [role, setRole] = useState(target?.membership?.role || 'warga')

    if (!target) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">

                <h2 className="text-base font-semibold">Ubah Role</h2>

                <div>
                    <p className="text-sm text-gray-500">
                        Pengguna: <span className="font-medium text-gray-800">
                            {target.user?.nama || target.user?.email}
                        </span>
                    </p>
                    <p className="text-sm text-gray-500">
                        RT: <span className="font-medium text-gray-800">
                            {target.membership?.rt?.nama || 'System'}
                        </span>
                    </p>
                </div>

                <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm"
                >
                    {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onClose}
                        className="border rounded-xl px-4 py-2 text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => onSave(target.membership.id, role)}
                        disabled={saving}
                        className="bg-black text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>

            </div>
        </div>
    )
}
