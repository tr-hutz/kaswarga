// @ts-nocheck
'use client'

import { useState }       from 'react'
import { useToast }       from '@/components/ui/ToastProvider'
import { changePassword } from '@/lib/services/auth.service'
import ChangePasswordView from './ChangePasswordView'

export default function ChangePasswordContainer() {

    const { toast } = useToast()

    const [form,   setForm]   = useState({ current: '', next: '', confirm: '' })
    const [saving, setSaving] = useState(false)
    const [error,  setError]  = useState('')

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
        setError('')
    }

    async function handleSubmit(e) {

        e.preventDefault()

        if (form.next.length < 8) {
            setError('Password baru minimal 8 karakter.')
            return
        }

        if (form.next !== form.confirm) {
            setError('Konfirmasi password tidak cocok.')
            return
        }

        setSaving(true)
        setError('')

        try {
            await changePassword(form.next)
            toast({ message: 'Password berhasil diubah.', type: 'success' })
            setForm({ current: '', next: '', confirm: '' })
        } catch (err) {
            setError(err.message || 'Gagal mengubah password.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <ChangePasswordView
            form={form}
            set={set}
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
        />
    )
}
