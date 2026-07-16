'use client'

import { useState }                   from 'react'
import type { FormEvent }             from 'react'
import { submitResidentRegistration }     from '@/lib/services/registration.service'
import ResidentRegistrationView           from './ResidentRegistrationView'
import { useTranslations }             from 'next-intl'

const EMPTY = {
    name: '', email: '', rtCode: '', block: '', houseNumber: '', phone: ''
}

export default function ResidentRegistrationContainer() {

    const t = useTranslations('registration.resident')

    const [form,       setForm]       = useState(EMPTY)
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState('')
    const [success,    setSuccess]    = useState(false)

    function set(key: string, val: string) {
        setForm(prev => ({ ...prev, [key]: val }))
        setError('')
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            await submitResidentRegistration({
                name:        form.name,
                email:       form.email,
                rtCode:      form.rtCode,
                block:       form.block       || null,
                houseNumber: form.houseNumber || null,
                phone:       form.phone       || null
            })
            setSuccess(true)
        } catch (err) {
            setError((err as Error).message || t('errors.submitFailed'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <ResidentRegistrationView
            form={form}
            set={set}
            submitting={submitting}
            error={error}
            success={success}
            onSubmit={handleSubmit}
        />
    )
}
