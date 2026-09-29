'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GuideAdminRow }                from '@/lib/repositories/guide.repository'
import type { FormData }                     from '@/features/guide/components/GuideSectionForm'

export interface GuideAdminState {
    sections:    GuideAdminRow[]
    loading:     boolean
    saving:      boolean
    error:       string | null
    editing:     GuideAdminRow | null
    creating:    boolean
    load:        () => void
    startCreate: () => void
    startEdit:   (row: GuideAdminRow) => void
    cancelForm:  () => void
    save:        (data: FormData) => Promise<void>
    remove:      (id: string) => Promise<void>
}

export function useGuideAdmin(): GuideAdminState {
    const [sections, setSections] = useState<GuideAdminRow[]>([])
    const [loading,  setLoading]  = useState(true)
    const [saving,   setSaving]   = useState(false)
    const [error,    setError]    = useState<string | null>(null)
    const [editing,  setEditing]  = useState<GuideAdminRow | null>(null)
    const [creating, setCreating] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res  = await fetch('/api/guide?admin=true')
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json() as GuideAdminRow[]
            setSections(data)
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    function startCreate() { setCreating(true); setEditing(null) }
    function startEdit(row: GuideAdminRow) { setEditing(row); setCreating(false) }
    function cancelForm() { setEditing(null); setCreating(false) }

    async function save(data: FormData) {
        setSaving(true)
        setError(null)
        try {
            if (editing) {
                const res = await fetch(`/api/guide/${editing.id}`, {
                    method:  'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(data),
                })
                if (!res.ok) throw new Error(await res.text())
            } else {
                const res = await fetch('/api/guide', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(data),
                })
                if (!res.ok) throw new Error(await res.text())
            }
            cancelForm()
            await load()
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setSaving(false)
        }
    }

    async function remove(id: string) {
        setSaving(true)
        setError(null)
        try {
            const res = await fetch(`/api/guide/${id}`, { method: 'DELETE' })
            if (!res.ok && res.status !== 204) throw new Error(await res.text())
            await load()
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return { sections, loading, saving, error, editing, creating, load, startCreate, startEdit, cancelForm, save, remove }
}
