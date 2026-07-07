// @ts-nocheck
'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { createRt, updateRt, deleteRt } from '@/lib/services/rt.service'

export function useRtActions(refresh) {

    const { toast } = useToast()

    const [selected,  setSelected]  = useState(null)
    const [formOpen,  setFormOpen]  = useState(false)
    const [delTarget, setDelTarget] = useState(null)
    const [deleting,  setDeleting]  = useState(false)

    function openCreate() {
        setSelected(null)
        setFormOpen(true)
    }

    function openEdit(rt) {
        setSelected(rt)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setSelected(null)
    }

    async function handleSubmit(payload) {

        try {
            if (selected) {
                await updateRt(selected.id, payload)
                toast({ message: 'RT berhasil diperbarui.', type: 'success' })
            } else {
                await createRt(payload)
                toast({ message: 'RT baru berhasil dibuat.', type: 'success' })
            }
            closeForm()
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: err.message || 'Gagal menyimpan RT.', type: 'error' })
        }
    }

    async function handleDelete() {

        if (!delTarget) return

        setDeleting(true)

        try {
            await deleteRt(delTarget.id)
            toast({ message: `RT "${delTarget.nama}" berhasil dihapus.`, type: 'success' })
            setDelTarget(null)
            refresh()
        } catch (err) {
            console.error(err)
            toast({ message: err.message || 'Gagal menghapus RT.', type: 'error' })
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
