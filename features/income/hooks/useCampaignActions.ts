'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'

interface Options {
    onReload: () => void
}

export function useCampaignActions({ onReload }: Options) {
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
    const [drawerOpen,       setDrawerOpen]       = useState(false)
    const [formOpen,         setFormOpen]         = useState(false)
    const [submitting,       setSubmitting]       = useState(false)

    function openDrawer(row: any) {
        setSelectedCampaign(row)
        setDrawerOpen(true)
    }

    function closeDrawer() {
        setDrawerOpen(false)
        setSelectedCampaign(null)
    }

    function openCreateForm() {
        setSelectedCampaign(null)
        setFormOpen(true)
    }

    function openEditForm(row: any) {
        setSelectedCampaign(row)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setSelectedCampaign(null)
    }

    async function submitForm(payload: any) {
        setSubmitting(true)
        try {
            const isEdit = Boolean(selectedCampaign?.id)
            const url    = isEdit ? `/api/income/campaigns/${selectedCampaign.id}` : '/api/income/campaigns'
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

    async function activateCampaign(id: string) {
        const res = await fetch(`/api/income/campaigns/${id}/activate`, { method: 'POST' })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error ?? `Gagal mengaktifkan kampanye (${res.status})`)
        }
        closeDrawer()
        onReload()
    }

    async function cancelCampaign(id: string, note?: string) {
        const res = await fetch(`/api/income/campaigns/${id}/cancel`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ cancelled_note: note ?? null }),
        })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error ?? `Gagal membatalkan kampanye (${res.status})`)
        }
        closeDrawer()
        onReload()
    }

    async function deleteCampaign(id: string) {
        const res = await fetch(`/api/income/campaigns/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error ?? `Gagal menghapus kampanye (${res.status})`)
        }
        closeDrawer()
        onReload()
    }

    return {
        selectedCampaign,
        drawerOpen,
        formOpen,
        submitting,
        openDrawer,
        closeDrawer,
        openCreateForm,
        openEditForm,
        closeForm,
        submitForm,
        activateCampaign,
        cancelCampaign,
        deleteCampaign,
    }
}
