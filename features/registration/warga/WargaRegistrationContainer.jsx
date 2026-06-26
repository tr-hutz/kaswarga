'use client'

import { useState }                   from 'react'
import { submitWargaRegistration }     from '@/lib/services/registration.service'
import WargaRegistrationView           from './WargaRegistrationView'

const EMPTY = {
    nama: '', email: '', rtKode: '', blok: '', noRumah: '', noHp: ''
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
                nama:    form.nama,
                email:   form.email,
                rtKode:  form.rtKode,
                blok:    form.blok   || null,
                noRumah: form.noRumah || null,
                noHp:    form.noHp   || null
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
