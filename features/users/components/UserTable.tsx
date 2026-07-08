// @ts-nocheck
'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function UserTable({ data, loading, currentUserId, onEditRole, onRemoveMembership }) {
    const t = useTranslations('users')

    const ROLE_COLORS = {
        SUPER_ADMIN: 'bg-purple-50 text-purple-700',
        CHAIR:       'bg-blue-50 text-blue-700',
        ADMIN:       'bg-indigo-50 text-indigo-700',
        TREASURER:   'bg-amber-50 text-amber-700',
        RESIDENT:    'bg-gray-100 text-gray-600'
    }

    if (loading) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                {t('table.loading')}
            </div>
        )
    }

    if (!data?.length) {
        return (
            <div className="py-16 text-center text-sm text-gray-400">
                {t('table.empty')}
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-4 py-3 text-left">{t('table.name')}</th>
                        <th className="px-4 py-3 text-left">{t('table.email')}</th>
                        <th className="px-4 py-3 text-left">{t('table.rt')}</th>
                        <th className="px-4 py-3 text-left">{t('table.role')}</th>
                        <th className="px-4 py-3 text-center">{t('table.actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map(user => {

                        const memberships = user.memberships || []

                        if (!memberships.length) {
                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{user.name || '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-400 italic">{t('table.noRt')}</td>
                                    <td className="px-4 py-3 text-gray-400 italic">-</td>
                                    <td className="px-4 py-3 text-center text-gray-400">-</td>
                                </tr>
                            )
                        }

                        const isSelf = user.id === currentUserId

                        return memberships.map((m, idx) => (
                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                {idx === 0 && (
                                    <>
                                        <td className="px-4 py-3 font-medium" rowSpan={memberships.length}>
                                            {user.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500" rowSpan={memberships.length}>
                                            {user.email}
                                        </td>
                                    </>
                                )}
                                <td className="px-4 py-3 text-gray-600">
                                    {m.rt?.name || <span className="italic text-gray-400">{t('editRole.system')}</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`
                                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                        ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {t(`roles.${m.role}`) || m.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {isSelf ? (
                                        <div className="text-center text-gray-300 text-xs">—</div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEditRole({ user, membership: m })}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                                                title={t('editRole.title')}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => onRemoveMembership(m)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                                title={t('removeMembership.title')}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    })}
                </tbody>
            </table>
        </div>
    )
}
