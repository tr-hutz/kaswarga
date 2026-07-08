// @ts-nocheck
'use client'

import { useState }       from 'react'
import { useToast }       from '@/components/ui/ToastProvider'
import { changePassword } from '@/lib/services/auth.service'
import ChangePasswordView from './ChangePasswordView'
import { useTranslations } from 'next-intl'

export default function ChangePasswordContainer() {

    const { toast } = useToast()
    const t = useTranslations('settings')

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
            setError(t('errors.minLength'))
            return
        }

        if (form.next !== form.confirm) {
            setError(t('errors.mismatch'))
            return
        }

        setSaving(true)
        setError('')

        try {
            await changePassword(form.next)
            toast({ message: t('errors.success'), type: 'success' })
            setForm({ current: '', next: '', confirm: '' })
        } catch (err) {
            setError(err.message || t('errors.failed'))
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
