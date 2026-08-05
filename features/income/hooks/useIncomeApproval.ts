'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState }   from 'react'
import { useToast }   from '@/components/ui/ToastProvider'

export function useIncomeApproval({ onSuccess }: { onSuccess?: () => void } = {}) {
    const { toast } = (useToast() as any)
    const [loading, setLoading] = useState(false)

    async function approve(id: string) {
        setLoading(true)
        try {
            const res  = await fetch(`/api/income/${id}/approve`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Gagal menyetujui pemasukan')
            toast({ message: 'Pemasukan disetujui.', type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: (err as any).message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    async function reject(id: string, reason: string) {
        setLoading(true)
        try {
            const res  = await fetch(`/api/income/${id}/reject`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ reason }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Gagal menolak pemasukan')
            toast({ message: 'Pemasukan ditolak.', type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: (err as any).message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return { loading, approve, reject }
}
