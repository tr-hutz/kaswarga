'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { createRt, updateRt, deleteRt } from '@/lib/services/rt.service'

export function useRtActions(refresh: () => void) {

    const { toast } = (useToast() as any)

    const [selected,  setSelected]  = useState<any>(null)
    const [formOpen,  setFormOpen]  = useState(false)
    const [delTarget, setDelTarget] = useState<any>(null)
    const [deleting,  setDeleting]  = useState(false)

    function openCreate() {
        setSelected(null)
        setFormOpen(true)
    }

    function openEdit(rt: any) {
        setSelected(rt)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setSelected(null)
    }

    async function handleSubmit(payload: any) {

        try {
            if (selected) {
                await updateRt(selected.id, payload)
                toast({ message: 'RT updated.', type: 'success' })
            } else {
                await createRt(payload)
                toast({ message: 'RT created.', type: 'success' })
            }
            closeForm()
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: (err as any).message || 'Failed to save RT.', type: 'error' })
        }
    }

    async function handleDelete() {

        if (!delTarget) return

        setDeleting(true)

        try {
            await deleteRt(delTarget.id)
            toast({ message: `RT "${delTarget.name}" deleted.`, type: 'success' })
            setDelTarget(null)
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: (err as any).message || 'Failed to delete RT.', type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    return {
        selected,
        formOpen,
        openCreate,
        openEdit,
        closeForm,
        handleSubmit,
        delTarget,
        setDelTarget,
        deleting,
        handleDelete
    }
}
