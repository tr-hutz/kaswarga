'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/ToastProvider'

export function useExpenseApproval({ onSuccess }: { onSuccess?: () => void } = {}) {

    const { toast } = (useToast() as any)
    const t = useTranslations('expenses.toast')
    const [loading, setLoading] = useState(false)

    async function approve(id: string) {
        setLoading(true)
        try {
            const res = await fetch('/api/expenses/approve', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Failed to approve')
            toast({ message: t('approved'), type: 'success' })
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
            const res = await fetch('/api/expenses/reject', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id, reason }),
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.error || 'Failed to reject')
            toast({ message: t('rejected'), type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: (err as any).message, type: 'error' })
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
            if (!res.ok) throw new Error(body.error || 'Failed to approve all')
            toast({ message: t('approvedAll', { count: body.approved ?? 0 }), type: 'success' })
            onSuccess?.()
        } catch (err) {
            toast({ message: (err as any).message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return { loading, approve, reject, approveAll }
}