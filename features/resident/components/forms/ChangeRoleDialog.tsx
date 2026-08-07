'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/ToastProvider'

// DB enum values that can be assigned (SUPER_ADMIN excluded)
const ASSIGNABLE_ROLES = [
    { enum: 'ADMIN',     labelKey: 'roles.ADMIN'     },
    { enum: 'CHAIR',     labelKey: 'roles.CHAIR'     },
    { enum: 'TREASURER', labelKey: 'roles.TREASURER' },
    { enum: 'SECRETARY', labelKey: 'roles.SECRETARY' },
    { enum: 'RESIDENT',  labelKey: 'roles.RESIDENT'  },
]

interface ChangeRoleDialogProps {
    open:          boolean
    onClose:       () => void
    membershipId:  string
    currentRole:   string  // DB enum: ADMIN | CHAIR | TREASURER | SECRETARY | RESIDENT
    residentName:  string
    onSuccess:     () => void
}

export default function ChangeRoleDialog({
    open, onClose, membershipId, currentRole, residentName, onSuccess,
}: ChangeRoleDialogProps) {
    const t  = useTranslations('residents.roleChange')
    const tr = useTranslations('residents.roles')
    const tc = useTranslations('common')
    const { toast } = useToast() as any

    const [selectedRole, setSelectedRole] = useState(currentRole)
    const [saving,       setSaving]       = useState(false)

    // Reset selection each time the dialog opens for a (potentially different) resident
    if (!open) return null

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (selectedRole === currentRole) { onClose(); return }
        setSaving(true)
        try {
            const res = await fetch(`/api/members/${membershipId}/role`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ role: selectedRole }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || res.statusText)
            }
            toast({ message: t('success'), type: 'success' })
            onSuccess()
            onClose()
        } catch (err) {
            const msg = (err as Error).message
            const displayMsg = msg === 'RT harus memiliki minimal satu Administrator'
                ? t('lastAdminError')
                : t('error')
            toast({ message: displayMsg, type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-surface rounded-lg p-6 w-full max-w-sm space-y-4"
            >
                <h2 className="text-lg font-semibold text-foreground">{t('dialogTitle')}</h2>
                <p className="text-sm text-muted">{residentName}</p>

                <div className="space-y-1">
                    <label className="text-xs text-muted block">{t('currentRole')}</label>
                    <p className="text-sm text-foreground font-medium">
                        {tr(currentRole as Parameters<typeof tr>[0])}
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-muted block">{t('newRole')}</label>
                    <select
                        value={selectedRole}
                        onChange={e => setSelectedRole(e.target.value)}
                        className="w-full border border-divider rounded-lg px-3 py-2 text-sm bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        {ASSIGNABLE_ROLES.map(r => (
                            <option key={r.enum} value={r.enum}>
                                {tr(r.labelKey.replace('roles.', '') as Parameters<typeof tr>[0])}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-divider rounded-lg px-4 py-2 text-sm hover:bg-canvas transition-colors"
                    >
                        {tc('actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving || selectedRole === currentRole}
                        className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50 transition-colors"
                    >
                        {saving ? tc('states.saving') : tc('actions.save')}
                    </button>
                </div>
            </form>
        </div>
    )
}
