'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const ROLE_VALUES = ['CHAIR', 'ADMIN', 'TREASURER', 'RESIDENT']

interface EditRoleFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target:  any
    onSave:  (membershipId: string, role: string) => void
    onClose: () => void
    saving:  boolean
}

export default function EditRoleForm({ target, onSave, onClose, saving }: EditRoleFormProps) {
    const t  = useTranslations('users')
    const tc = useTranslations('common')

    const [role, setRole] = useState(target?.membership?.role || 'RESIDENT')

    if (!target) return null

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl p-6 w-full max-w-sm space-y-4">

                <h2 className="text-base font-semibold">{t('editRole.title')}</h2>

                <div>
                    <p className="text-sm text-muted">
                        {t('editRole.user')}: <span className="font-medium text-foreground">
                            {target.user?.name || target.user?.email}
                        </span>
                    </p>
                    <p className="text-sm text-muted">
                        {t('editRole.rt')}: <span className="font-medium text-foreground">
                            {target.membership?.rt?.name || t('editRole.system')}
                        </span>
                    </p>
                </div>

                <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full border border-divider rounded-lg px-4 py-2.5 text-sm"
                >
                    {ROLE_VALUES.map(r => (
                        <option key={r} value={r}>{t(`roles.${r}`)}</option>
                    ))}
                </select>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onClose}
                        className="border border-divider rounded-lg px-4 py-2 text-sm"
                    >
                        {tc('actions.cancel')}
                    </button>
                    <button
                        onClick={() => onSave(target.membership.id, role)}
                        disabled={saving}
                        className="bg-primary text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {saving ? tc('states.saving') : tc('actions.save')}
                    </button>
                </div>

            </div>
        </div>
    )
}
