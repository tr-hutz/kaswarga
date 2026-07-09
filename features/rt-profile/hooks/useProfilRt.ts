// @ts-nocheck
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { getOwnRt, updateRt } from '@/lib/services/rt.service'

export function useRtProfile() {

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
            toast({ message: 'Failed to load RT data.', type: 'error' })
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
            toast({ message: 'RT profile updated.', type: 'success' })
        } catch (err) {
            console.error(err)
            toast({ message: err.message || 'Failed to save changes.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return { rt, loading, saving, handleSave }
}
