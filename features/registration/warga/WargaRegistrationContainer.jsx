'use client'

import { useState }                   from 'react'
import { submitWargaRegistration }     from '@/lib/services/registration.service'
import WargaRegistrationView           from './WargaRegistrationView'

const EMPTY = {
    name: '', email: '', rtCode: '', block: '', houseNumber: '', phone: ''
}

export default function WargaRegistrationContainer() {

    const [form,       setForm]       = useState(EMPTY)
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState('')
    const [success,    setSuccess]    = useState(false)

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
        setError('')
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            await submitWargaRegistration({
                name:        form.name,
                email:       form.email,
                rtCode:      form.rtCode,
                block:       form.block       || null,
                houseNumber: form.houseNumber || null,
                phone:       form.phone       || null
            })
            setSuccess(true)
        } catch (err) {
            setError(err.message || 'Gagal mengirim pendaftaran.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <WargaRegistrationView
            form={form}
            set={set}
            submitting={submitting}
            error={error}
            success={success}
            onSubmit={handleSubmit}
        />
    )
}
