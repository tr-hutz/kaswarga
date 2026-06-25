'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { updateMembershipRole, removeMembership } from '@/lib/services/users.service'
import { getCurrentMembership } from '@/lib/auth/getCurrentMembership'

export function useUsersActions(refresh) {

    const { toast } = useToast()

    const [editTarget, setEditTarget] = useState(null) // { user, membership }
    const [delTarget,  setDelTarget]  = useState(null) // membership object
    const [saving,     setSaving]     = useState(false)

    async function handleUpdateRole(membershipId, newRole) {

        setSaving(true)

        try {
            const actor = await getCurrentMembership()
            await updateMembershipRole(membershipId, newRole, actor)
            toast({ message: 'Role berhasil diperbarui.', type: 'success' })
            setEditTarget(null)
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: err.message || 'Gagal memperbarui role.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemoveMembership() {

        if (!delTarget) return

        setSaving(true)

        try {
            const actor = await getCurrentMembership()
            await removeMembership(delTarget.id, actor)
            toast({ message: 'Membership berhasil dihapus.', type: 'success' })
            setDelTarget(null)
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: err.message || 'Gagal menghapus membership.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return {
        editTarget,
        setEditTarget,
        delTarget,
        setDelTarget,
        saving,
        handleUpdateRole,
        handleRemoveMembership
    }
}
