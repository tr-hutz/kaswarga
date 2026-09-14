'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'

interface Options {
    onReload: () => void
}

export function useDonationActions({ onReload }: Options) {
    const [selectedDonation, setSelectedDonation] = useState<any>(null)
    const [drawerOpen,       setDrawerOpen]       = useState(false)
    const [formOpen,         setFormOpen]         = useState(false)
    const [submitting,       setSubmitting]       = useState(false)

    function openDrawer(row: any) {
        setSelectedDonation(row)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedDonation(null)
    }

    function openCreateForm() {
        setSelectedDonation(null)
        setFormOpen(true)
    }

    function openEditForm(row: any) {
        setSelectedDonation(row)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setSelectedDonation(null)
    }

    async function submitForm(payload: any) {
        setSubmitting(true)
        try {
            const isEdit = Boolean(selectedDonation?.id)
            const url    = isEdit ? `/api/income/donations/${selectedDonation.id}` : '/api/income/donations'
            const method = isEdit ? 'PUT' : 'POST'
            const res    = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error ?? 'Failed')
            }
            closeForm()
            onReload()
        } finally {
            setSubmitting(false)
        }
    }

    async function activateDonation(id: string) {
        const res = await fetch(`/api/income/donations/${id}/activate`, { method: 'POST' })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error ?? `Gagal mengaktifkan donasi (${res.status})`)
        }
        closeDrawer()
        onReload()
    }

    async function cancelDonation(id: string, note?: string) {
        const res = await fetch(`/api/income/donations/${id}/cancel`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ cancelled_note: note ?? null }),
        })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error ?? `Gagal membatalkan donasi (${res.status})`)
        }
        closeDrawer()
        onReload()
    }

    async function deleteDonation(id: string) {
        const res = await fetch(`/api/income/donations/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error ?? `Gagal menghapus donasi (${res.status})`)
        }
        closeDrawer()
        onReload()
    }

    return {
        selectedDonation,
        drawerOpen,
        formOpen,
        submitting,
        openDrawer,
        closeDrawer,
        openCreateForm,
        openEditForm,
        closeForm,
        submitForm,
        activateDonation,
        cancelDonation,
        deleteDonation,
    }
}
