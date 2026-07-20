'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { getOwnRt, updateRt } from '@/lib/services/rt.service'

export function useRtProfile() {

    const { toast } = (useToast() as any)

    const [rt,      setRt]      = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)

    const load = useCallback(async () => {

        setLoading(true)

        try {
            const data = await getOwnRt()
            setRt(data)
        } catch (err) {
            console.error('[useRtProfile]', err)
            toast({ message: 'Failed to load RT data.', type: 'error' })
        } finally {
            setLoading(false)
        }

    }, [])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { load() }, [load])

    async function handleSave(payload: any) {

        if (!rt?.id) return

        setSaving(true)

        try {
            const updated = await updateRt(rt.id, payload)
            setRt(updated)
            toast({ message: 'RT profile updated.', type: 'success' })
        } catch (err) {
            console.error(err)
            toast({ message: (err as any).message || 'Failed to save changes.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return { rt, loading, saving, handleSave }
}
