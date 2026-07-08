// @ts-nocheck
'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'

export function useExpenseApproval({ onSuccess } = {}) {

    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    async function approve(id) {
        setLoading(true)
        try {
            const res = await fetch('/api/expenses/approve', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Gagal menyetujui')
            toast({ message: 'Pengeluaran berhasil disetujui.', type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    async function reject(id, reason) {
        setLoading(true)
        try {
            const res = await fetch('/api/expenses/reject', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id, reason }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Gagal menolak')
            toast({ message: 'Pengeluaran berhasil ditolak.', type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    async function approveAll() {
        setLoading(true)
        try {
            const res = await fetch('/api/expenses/approve-all', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Gagal menyetujui semua')
            toast({ message: `${body.approved} pengeluaran berhasil disetujui.`, type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: err.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return { loading, approve, reject, approveAll }
}