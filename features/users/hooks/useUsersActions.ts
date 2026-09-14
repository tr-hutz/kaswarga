'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { updateMembershipRole, removeMembership } from '@/lib/services/users.service'
import { getCurrentMembership } from '@/lib/auth/getCurrentMembership'

export function useUsersActions(refresh: () => void) {

    const { toast } = useToast()

    const [editTarget, setEditTarget] = useState<any>(null) // { user, membership }
    const [delTarget,  setDelTarget]  = useState<any>(null) // membership object
    const [saving,     setSaving]     = useState(false)

    async function handleUpdateRole(membershipId: string, newRole: string) {

        setSaving(true)

        try {
            const actor = await getCurrentMembership()
            await updateMembershipRole(membershipId, newRole as any, actor as any)
            toast({ message: 'Role updated.', type: 'success' })
            setEditTarget(null)
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: err instanceof Error ? err.message : 'Failed to update role.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemoveMembership() {

        if (!delTarget) return

        setSaving(true)

        try {
            const actor = await getCurrentMembership()
            await removeMembership(delTarget.id, actor as any)
            toast({ message: 'Membership removed.', type: 'success' })
            setDelTarget(null)
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: err instanceof Error ? err.message : 'Failed to remove membership.', type: 'error' })
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
