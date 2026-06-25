'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { getOwnRt, updateRt } from '@/lib/services/rt.service'

export function useProfilRt() {

    const { toast } = useToast()

    const [rt,      setRt]      = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)

    const load = useCallback(async () => {

        setLoading(true)

        try {
            const data = await getOwnRt()
            setRt(data)
        } catch (err) {
            console.error('[useProfilRt]', err)
            toast({ message: 'Gagal memuat data RT.', type: 'error' })
        } finally {
            setLoading(false)
        }

    }, [])

    useEffect(() => { load() }, [load])

    async function handleSave(payload) {

        if (!rt?.id) return

        setSaving(true)

        try {
            const updated = await updateRt(rt.id, payload)
            setRt(updated)
            toast({ message: 'Profil RT berhasil diperbarui.', type: 'success' })
        } catch (err) {
            console.error(err)
            toast({ message: err.message || 'Gagal menyimpan perubahan.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return { rt, loading, saving, handleSave }
}
