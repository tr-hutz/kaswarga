'use client'

import { useState }        from 'react'
import { useTranslations }  from 'next-intl'
import { useToast }         from '@/components/ui/ToastProvider'
import type { RoleRow }     from '@/lib/repositories/role.repository'

export function useRolesActions(refresh: () => void) {
    const t      = useTranslations('roles')
    const { toast } = useToast()

    const [formTarget,    setFormTarget]    = useState<RoleRow | null>(null)
    const [formOpen,      setFormOpen]      = useState(false)
    const [confirmTarget, setConfirmTarget] = useState<RoleRow | null>(null)
    const [saving,        setSaving]        = useState(false)

    function openCreate() {
        setFormTarget(null)
        setFormOpen(true)
    }

    function openEdit(role: RoleRow) {
        setFormTarget(role)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setFormTarget(null)
    }

    function openToggleActive(role: RoleRow) {
        setConfirmTarget(role)
    }

    function closeConfirm() {
        setConfirmTarget(null)
    }

    async function handleSave(payload: { name: string; code: string; description: string | null }) {
        setSaving(true)
        try {
            const isEdit = !!formTarget
            const url    = isEdit ? `/api/roles/${formTarget!.id}` : '/api/roles'
            const method = isEdit ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const body = await res.json() as { error?: string }
                throw new Error(body.error ?? res.statusText)
            }

            toast({ message: isEdit ? t('toast.updated') : t('toast.created'), type: 'success' })
            closeForm()
            refresh()
        } catch (err) {
            toast({ message: (err as Error).message || t('toast.saveFailed'), type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleActive() {
        if (!confirmTarget) return
        setSaving(true)
        try {
            const res = await fetch(`/api/roles/${confirmTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !confirmTarget.is_active }),
            })

            if (!res.ok) {
                const body = await res.json() as { error?: string }
                throw new Error(body.error ?? res.statusText)
            }

            toast({ message: confirmTarget.is_active ? t('toast.deactivated') : t('toast.activated'), type: 'success' })
            closeConfirm()
            refresh()
        } catch (err) {
            toast({ message: (err as Error).message || t('toast.saveFailed'), type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return {
        formOpen,
        formTarget,
        confirmTarget,
        saving,
        openCreate,
        openEdit,
        closeForm,
        openToggleActive,
        closeConfirm,
        handleSave,
        handleToggleActive,
    }
}
