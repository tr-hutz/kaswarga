'use client'

import { useState }                                  from 'react'
import { generateRtCode, submitRtRegistration }       from '@/lib/services/registration.service'
import RtRegistrationView                             from './RtRegistrationView'

const EMPTY = {
    name: '', code: '', address: '', city: '', province: '', postalCode: '',
    monthlyFee: '', bankName: '', accountNumber: '', accountHolder: '',
    chairmanName: '', chairmanEmail: '',
    adminName: '', adminEmail: '',
    treasurerName: '', treasurerEmail: ''
}

export default function RtRegistrationContainer() {

    const [form,       setForm]       = useState(EMPTY)
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error,      setError]      = useState('')
    const [success,    setSuccess]    = useState(false)

    function set(key, val) {
        setForm(prev => ({ ...prev, [key]: val }))
        setError('')
    }

    async function handleGenerateCode() {
        setGenerating(true)
        try {
            const code = await generateRtCode()
            set('code', code)
        } catch (err) {
            setError('Gagal generate kode: ' + err.message)
        } finally {
            setGenerating(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        // Validate unique emails
        const emails = [form.chairmanEmail, form.adminEmail, form.treasurerEmail].filter(Boolean)
        const unique  = new Set(emails.map(e => e.toLowerCase()))
        if (unique.size !== emails.length) {
            setError('Email ketua, admin, dan bendahara harus berbeda satu sama lain.')
            return
        }

        if (!form.code) {
            setError('Kode RT wajib diisi. Gunakan tombol Generate atau isi manual.')
            return
        }

        setSubmitting(true)
        try {
            await submitRtRegistration({
                chairmanName:   form.chairmanName,
                chairmanEmail:  form.chairmanEmail,
                adminName:      form.adminName,
                adminEmail:     form.adminEmail,
                treasurerName:  form.treasurerName  || null,
                treasurerEmail: form.treasurerEmail || null,
                rtData: {
                    name:          form.name,
                    code:          form.code,
                    address:       form.address,
                    city:          form.city,
                    province:      form.province,
                    postalCode:    form.postalCode,
                    monthlyFee:    Number(form.monthlyFee) || 0,
                    bankName:      form.bankName,
                    accountNumber: form.accountNumber,
                    accountHolder: form.accountHolder
                }
            })
            setSuccess(true)
        } catch (err) {
            setError(err.message || 'Gagal mengirim pendaftaran.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <RtRegistrationView
            form={form}
            set={set}
            generating={generating}
            submitting={submitting}
            error={error}
            success={success}
            onGenerateCode={handleGenerateCode}
            onSubmit={handleSubmit}
        />
    )
}
