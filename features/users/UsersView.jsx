'use client'

import { AlertTriangle } from 'lucide-react'
import UserTable   from './components/UserTable'
import EditRoleForm from './components/EditRoleForm'

export default function UsersView({
    data,
    loading,
    editTarget,
    setEditTarget,
    delTarget,
    setDelTarget,
    saving,
    handleUpdateRole,
    handleRemoveMembership
}) {

    return (

        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold">Kelola Pengguna</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Manajemen role dan keanggotaan pengguna
                </p>
            </div>

            {/* Table */}
            <UserTable
                data={data}
                loading={loading}
                onEditRole={setEditTarget}
                onRemoveMembership={setDelTarget}
            />

            {/* Edit Role Modal */}
            <EditRoleForm
                target={editTarget}
                onSave={handleUpdateRole}
                onClose={() => setEditTarget(null)}
                saving={saving}
            />

            {/* Remove Membership Confirm */}
            {delTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <h2 className="text-base font-semibold">Hapus Membership</h2>
                        </div>

                        <p className="text-sm text-gray-600">
                            Hapus akses ke RT <span className="font-medium">{delTarget.rt?.nama}</span>?
                            Pengguna tidak akan bisa mengakses RT ini.
                        </p>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => setDelTarget(null)}
                                className="border rounded-xl px-4 py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleRemoveMembership}
                                disabled={saving}
                                className="bg-red-600 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50"
                            >
                                {saving ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}
